import "server-only";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { randomBytes } from "node:crypto";
import { db } from "@/lib/db";

export type ActiveRole = "admin" | "student";

const SESSION_COOKIE = "wmxz_session";
const SESSION_DAYS = 7;

export async function createSession(userId: string, activeRole: ActiveRole) {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);

  await db.session.create({
    data: { token, userId, activeRole, expiresAt },
  });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    expires: expiresAt,
    path: "/",
  });
}

export async function getCurrentSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await db.session.findUnique({
    where: { token },
    include: {
      user: {
        include: {
          roles: { include: { role: true } },
          profile: true,
        },
      },
    },
  });

  if (!session || session.expiresAt < new Date()) {
    if (session) await db.session.delete({ where: { id: session.id } }).catch(() => null);
    cookieStore.delete(SESSION_COOKIE);
    return null;
  }

  return session;
}

export async function requireRole(role: ActiveRole) {
  const session = await getCurrentSession();
  const hasRole = session?.user.roles.some((item) => item.role.key === role);

  if (!session || session.activeRole !== role || !hasRole) {
    redirect(role === "admin" ? "/admin/login" : "/student/login");
  }

  return session;
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await db.session.deleteMany({ where: { token } });
  }
  cookieStore.delete(SESSION_COOKIE);
}

export async function switchActiveRole(targetRole: ActiveRole) {
  const session = await getCurrentSession();
  if (!session) return { ok: false, message: "请先登录" };

  const hasRole = session.user.roles.some((item) => item.role.key === targetRole);
  if (!hasRole) {
    return { ok: false, message: targetRole === "admin" ? "当前账号没有管理员身份" : "当前账号没有学员身份" };
  }

  await db.session.update({
    where: { id: session.id },
    data: { activeRole: targetRole },
  });
  return { ok: true };
}

export async function loginWithPassword(phone: string, password: string, role: ActiveRole) {
  const user = await db.user.findUnique({
    where: { phone },
    include: { roles: { include: { role: true } } },
  });

  if (!user || user.status !== "active") return { ok: false, message: "账号不存在或已被禁用" };
  const hasRole = user.roles.some((item) => item.role.key === role);
  if (!hasRole) return { ok: false, message: role === "admin" ? "该账号没有管理员权限" : "该账号不是普通室员" };

  const matched = await bcrypt.compare(password, user.passwordHash);
  if (!matched) return { ok: false, message: "密码错误" };

  await createSession(user.id, role);
  return { ok: true };
}

export async function createMockOtp(phone: string) {
  const user = await db.user.findUnique({ where: { phone } });
  await db.otpCode.create({
    data: {
      phone,
      code: "123456",
      purpose: "login",
      userId: user?.id,
      expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    },
  });
  return "123456";
}

export async function loginWithOtp(phone: string, code: string, role: ActiveRole) {
  if (code !== "123456") return { ok: false, message: "模拟验证码错误，请使用 123456" };

  const user = await db.user.findUnique({
    where: { phone },
    include: { roles: { include: { role: true } } },
  });

  if (!user || user.status !== "active") return { ok: false, message: "账号不存在或已被禁用" };
  const hasRole = user.roles.some((item) => item.role.key === role);
  if (!hasRole) return { ok: false, message: role === "admin" ? "该账号没有管理员权限" : "该账号不是普通室员" };

  await createSession(user.id, role);
  await db.otpCode.updateMany({
    where: { phone, code: "123456", usedAt: null },
    data: { usedAt: new Date() },
  });
  return { ok: true };
}
