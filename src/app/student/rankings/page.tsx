import { StudentShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function StudentRankingsPage() {
  await requireRole("student");
  const members = await db.memberProfile.findMany({ include: { user: true }, orderBy: { points: "desc" } });

  return (
    <StudentShell>
      <h1 className="text-3xl font-black text-slate-950">全员榜单</h1>
      <p className="mt-2 text-slate-600">榜单全员可见，首版优先按积分排序。</p>
      <div className="mt-6 grid gap-3">
        {members.map((member, index) => (
          <Card key={member.id} className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-lg font-black text-white">{index + 1}</div>
              <div>
                <h2 className="font-bold text-slate-950">{member.user.name}</h2>
                <p className="text-sm text-slate-500">{member.major} · {member.studentNo ?? "未设置学号"}</p>
              </div>
            </div>
            <p className="text-2xl font-black text-brand-700">{member.points}</p>
          </Card>
        ))}
      </div>
    </StudentShell>
  );
}
