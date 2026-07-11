import { AdminShell } from "@/components/shell";
import { Card, StatCard } from "@/components/ui";
import { adjustMemberPointsAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

const sourceMap: Record<string, string> = {
  checkin: "打卡",
  task: "任务",
  quiz: "小测试",
  manual_reward: "手动奖励",
  manual_deduct: "手动扣减",
  manual: "手动调整",
};

export default async function AdminPointsPage() {
  await requireRole("admin");
  const [members, ledgers, totalPoints] = await Promise.all([
    db.memberProfile.findMany({ include: { user: true }, orderBy: { points: "desc" } }),
    db.pointLedger.findMany({ include: { user: true }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.memberProfile.aggregate({ _sum: { points: true } }),
  ]);

  return (
    <AdminShell>
      <h1 className="text-3xl font-black text-slate-950">积分奖惩</h1>
      <p className="mt-2 text-slate-600">管理员可手动奖励或扣减积分，每次调整都会写入积分明细。</p>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="成员数" value={members.length} />
        <StatCard label="总积分" value={totalPoints._sum.points ?? 0} />
        <StatCard label="明细记录" value={ledgers.length} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">手动奖惩</h2>
          <form action={adjustMemberPointsAction} className="mt-4 grid gap-3">
            <select name="userId" className="rounded-2xl border border-slate-200 px-4 py-3" required>
              {members.map((member) => (
                <option key={member.userId} value={member.userId}>{member.user.name} · 当前 {member.points} 分</option>
              ))}
            </select>
            <select name="mode" className="rounded-2xl border border-slate-200 px-4 py-3">
              <option value="reward">奖励积分</option>
              <option value="deduct">扣减积分</option>
            </select>
            <input name="amount" type="number" min={1} placeholder="积分数" className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <textarea name="reason" rows={4} placeholder="奖惩原因，必填" className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">提交调整</button>
          </form>
        </Card>

        <div className="grid gap-4">
          {ledgers.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="font-bold text-slate-950">{item.user.name}</h2>
                  <p className="mt-1 text-sm text-slate-500">{sourceMap[item.source] ?? item.source} · {formatDate(item.createdAt)}</p>
                  <p className="mt-2 text-slate-600">{item.reason}</p>
                </div>
                <p className={item.points >= 0 ? "text-2xl font-black text-emerald-600" : "text-2xl font-black text-red-600"}>
                  {item.points >= 0 ? "+" : ""}{item.points}
                </p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
