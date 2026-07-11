import { AdminShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { createMemberAction, toggleMemberStatusAction, updateMemberAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

function roleKeys(user: { roles: { role: { key: string } }[] }) {
  return user.roles.map((item) => item.role.key);
}

export default async function AdminMembersPage() {
  await requireRole("admin");
  const users = await db.user.findMany({
    include: { roles: { include: { role: true } }, profile: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell>
      <h1 className="text-3xl font-black text-slate-950">成员管理</h1>
      <p className="mt-2 text-slate-600">新增、编辑、禁用/恢复成员，并支持同一账号同时拥有管理员和学员身份。</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">新增成员</h2>
          <form action={createMemberAction} className="mt-4 grid gap-3">
            <input name="name" placeholder="姓名" className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <input name="phone" placeholder="手机号" className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <input name="email" placeholder="邮箱（可选）" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input name="password" placeholder="初始密码，默认 123456" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <div className="flex gap-4 text-sm text-slate-600">
              <label><input type="checkbox" name="roles" value="student" defaultChecked /> 学员</label>
              <label><input type="checkbox" name="roles" value="admin" /> 管理员</label>
            </div>
            <input name="studentNo" placeholder="学号" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input name="grade" placeholder="年级" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input name="major" placeholder="专业，默认软件技术" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <textarea name="bio" placeholder="备注" rows={3} className="rounded-2xl border border-slate-200 px-4 py-3" />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">创建成员</button>
          </form>
        </Card>

        <div className="grid gap-4">
          {users.map((user) => {
            const roles = roleKeys(user);
            return (
              <Card key={user.id}>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-slate-950">{user.name}</h2>
                    <p className="text-sm text-slate-500">{user.phone} · {user.profile?.studentNo ?? "未设置学号"} · {user.profile?.major ?? "未设置专业"}</p>
                    <div className="mt-3 flex gap-2 text-xs text-slate-500">
                      {user.roles.map((item) => <span key={item.id} className="rounded-full bg-slate-100 px-2 py-1">{item.role.name}</span>)}
                      <span className={user.status === "active" ? "rounded-full bg-emerald-50 px-2 py-1 text-emerald-700" : "rounded-full bg-red-50 px-2 py-1 text-red-700"}>{user.status === "active" ? "正常" : "已禁用"}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-black text-brand-700">{user.profile?.points ?? 0}</p>
                    <p className="text-xs text-slate-500">积分</p>
                  </div>
                </div>

                <form action={updateMemberAction} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4">
                  <input type="hidden" name="userId" value={user.id} />
                  <div className="grid gap-3 md:grid-cols-2">
                    <input name="name" defaultValue={user.name} className="rounded-xl border border-slate-200 px-3 py-2" required />
                    <input name="phone" defaultValue={user.phone} className="rounded-xl border border-slate-200 px-3 py-2" required />
                    <input name="email" defaultValue={user.email ?? ""} placeholder="邮箱" className="rounded-xl border border-slate-200 px-3 py-2" />
                    <input name="password" placeholder="新密码（不填则不改）" className="rounded-xl border border-slate-200 px-3 py-2" />
                    <input name="studentNo" defaultValue={user.profile?.studentNo ?? ""} placeholder="学号" className="rounded-xl border border-slate-200 px-3 py-2" />
                    <input name="grade" defaultValue={user.profile?.grade ?? ""} placeholder="年级" className="rounded-xl border border-slate-200 px-3 py-2" />
                    <input name="major" defaultValue={user.profile?.major ?? "软件技术"} placeholder="专业" className="rounded-xl border border-slate-200 px-3 py-2" />
                  </div>
                  <textarea name="bio" defaultValue={user.profile?.bio ?? ""} placeholder="备注" rows={2} className="rounded-xl border border-slate-200 px-3 py-2" />
                  <div className="flex gap-4 text-sm text-slate-600">
                    <label><input type="checkbox" name="roles" value="student" defaultChecked={roles.includes("student")} /> 学员</label>
                    <label><input type="checkbox" name="roles" value="admin" defaultChecked={roles.includes("admin")} /> 管理员</label>
                  </div>
                  <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">保存修改</button>
                </form>

                <form action={toggleMemberStatusAction} className="mt-3">
                  <input type="hidden" name="userId" value={user.id} />
                  <input type="hidden" name="status" value={user.status === "active" ? "disabled" : "active"} />
                  <button className={user.status === "active" ? "rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white" : "rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"}>
                    {user.status === "active" ? "禁用账号" : "恢复账号"}
                  </button>
                </form>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminShell>
  );
}
