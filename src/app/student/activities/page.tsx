import { StudentShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { signupActivityAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

const statusMap: Record<string, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

export default async function StudentActivitiesPage() {
  const session = await requireRole("student");
  const activities = await db.activity.findMany({
    where: { status: "published" },
    include: { signups: { where: { userId: session.userId } } },
    orderBy: { startAt: "asc" },
  });

  return (
    <StudentShell>
      <h1 className="text-3xl font-black text-slate-950">课程/活动报名</h1>
      <div className="mt-6 grid gap-4">
        {activities.map((activity) => {
          const signup = activity.signups[0];
          return (
            <Card key={activity.id}>
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{activity.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(activity.startAt)}</p>
                  <p className="mt-2 text-slate-600">{activity.description}</p>
                </div>
                <span className="h-fit rounded-full bg-slate-100 px-3 py-1 text-sm font-semibold text-slate-700">{signup ? statusMap[signup.status] : "未报名"}</span>
              </div>
              <form action={signupActivityAction} className="mt-4 flex flex-col gap-3 md:flex-row">
                <input type="hidden" name="activityId" value={activity.id} />
                <input name="reason" placeholder="报名说明（可选）" className="min-w-0 flex-1 rounded-2xl border border-slate-200 px-4 py-3" />
                <button className="rounded-2xl bg-brand-600 px-5 py-3 font-semibold text-white">提交报名</button>
              </form>
            </Card>
          );
        })}
      </div>
    </StudentShell>
  );
}
