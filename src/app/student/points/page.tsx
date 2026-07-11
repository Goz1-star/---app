import { StudentShell } from "@/components/shell";
import { Card, StatCard } from "@/components/ui";
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

export default async function StudentPointsPage() {
  const session = await requireRole("student");
  const [profile, ledgers] = await Promise.all([
    db.memberProfile.findUnique({ where: { userId: session.userId } }),
    db.pointLedger.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } }),
  ]);

  const earned = ledgers.filter((item) => item.points > 0).reduce((sum, item) => sum + item.points, 0);
  const deducted = ledgers.filter((item) => item.points < 0).reduce((sum, item) => sum + Math.abs(item.points), 0);

  return (
    <StudentShell>
      <h1 className="text-3xl font-black text-slate-950">我的积分</h1>
      <p className="mt-2 text-slate-600">查看积分总数和每一次积分变化明细。</p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <StatCard label="当前积分" value={profile?.points ?? 0} />
        <StatCard label="累计获得" value={earned} />
        <StatCard label="累计扣减" value={deducted} />
      </div>
      <div className="mt-6 grid gap-4">
        {ledgers.map((item) => (
          <Card key={item.id}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="font-bold text-slate-950">{sourceMap[item.source] ?? item.source}</h2>
                <p className="mt-1 text-sm text-slate-500">{formatDate(item.createdAt)}</p>
                <p className="mt-2 text-slate-600">{item.reason}</p>
              </div>
              <p className={item.points >= 0 ? "text-2xl font-black text-emerald-600" : "text-2xl font-black text-red-600"}>
                {item.points >= 0 ? "+" : ""}{item.points}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </StudentShell>
  );
}
