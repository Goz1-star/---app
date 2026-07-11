import { AdminShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminMembersPage() {
  await requireRole("admin");
  const members = await db.memberProfile.findMany({ include: { user: { include: { roles: { include: { role: true } } } } }, orderBy: { createdAt: "desc" } });

  return (
    <AdminShell>
      <h1 className="text-3xl font-black text-slate-950">成员管理</h1>
      <div className="mt-6 grid gap-4">
        {members.map((member) => (
          <Card key={member.id}>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{member.user.name}</h2>
                <p className="text-sm text-slate-500">{member.user.phone} · {member.studentNo ?? "未设置学号"} · {member.major}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-brand-700">{member.points}</p>
                <p className="text-xs text-slate-500">积分</p>
              </div>
            </div>
            <div className="mt-3 flex gap-2 text-xs text-slate-500">
              {member.user.roles.map((item) => <span key={item.id} className="rounded-full bg-slate-100 px-2 py-1">{item.role.name}</span>)}
            </div>
          </Card>
        ))}
      </div>
    </AdminShell>
  );
}
