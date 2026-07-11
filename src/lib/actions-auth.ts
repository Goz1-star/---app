"use server";

import { redirect } from "next/navigation";
import { createMockOtp, loginWithOtp, loginWithPassword, logout, switchActiveRole, type ActiveRole } from "@/lib/auth";

function getString(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

export async function passwordLoginAction(role: ActiveRole, formData: FormData) {
  const phone = getString(formData, "phone");
  const password = getString(formData, "password");
  const result = await loginWithPassword(phone, password, role);
  if (!result.ok) redirect(`/${role}/login?error=${encodeURIComponent(result.message ?? "登录失败")}`);
  redirect(role === "admin" ? "/admin" : "/student");
}

export async function otpLoginAction(role: ActiveRole, formData: FormData) {
  const phone = getString(formData, "phone");
  const code = getString(formData, "code");
  const result = await loginWithOtp(phone, code, role);
  if (!result.ok) redirect(`/${role}/login?error=${encodeURIComponent(result.message ?? "登录失败")}`);
  redirect(role === "admin" ? "/admin" : "/student");
}

export async function mockOtpAction(role: ActiveRole, formData: FormData) {
  const phone = getString(formData, "phone");
  if (phone) await createMockOtp(phone);
  redirect(`/${role}/login?sent=1&phone=${encodeURIComponent(phone)}`);
}

export async function switchRoleAction(role: ActiveRole) {
  const result = await switchActiveRole(role);
  if (!result.ok) redirect(`/${role}/login?error=${encodeURIComponent(result.message ?? "切换身份失败")}`);
  redirect(role === "admin" ? "/admin" : "/student");
}

export async function logoutAction() {
  await logout();
  redirect("/");
}
