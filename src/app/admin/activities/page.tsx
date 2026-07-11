import { AdminShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { createActivityAction, reviewSignupAction, updateActivityAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

const signupStatusMap: Record<string, string> = {
  pending: "待审核",
  approved: "已通过",
  rejected: "已拒绝",
};

const activityStatusMap: Record<string, string> = {
  published: "已发布",
  archived: "已下架",
};

export default async function AdminActivitiesPage() {
  await requireRole("admin");
  const activities = await db.activity.findMany({
    include: { signups: { include: { user: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell>
      <h1 className="text-3xl font-black text-slate-950">课程/活动管理</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-bold">创建课程/活动</h2>
          <form action={createActivityAction} className="mt-4 grid gap-3">
            <input name="title" placeholder="课程/活动名称" className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <textarea name="description" placeholder="说明" rows={4} className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <input name="startAt" type="datetime-local" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input name="endAt" type="datetime-local" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">创建</button>
          </form>
        </Card>

        <div className="grid gap-4">
          {activities.map((activity) => (
            <Card key={activity.id}>
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{activity.title}</h2>
                  <p className="mt-1 text-sm text-slate-500">开始时间：{formatDate(activity.startAt)}</p>
                  <p className="mt-2 text-slate-600">{activity.description}</p>
                </div>
                <span className="h-fit rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{activityStatusMap[activity.status] ?? activity.status} · 需要报名审核</span>
              </div>
              <form action={updateActivityAction} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4">
                <input type="hidden" name="id" value={activity.id} />
                <input name="title" defaultValue={activity.title} className="rounded-xl border border-slate-200 px-3 py-2" required />
                <textarea name="description" defaultValue={activity.description} rows={3} className="rounded-xl border border-slate-200 px-3 py-2" required />
                <input name="startAt" type="datetime-local" defaultValue={activity.startAt.toISOString().slice(0, 16)} className="rounded-xl border border-slate-200 px-3 py-2" />
                <input name="endAt" type="datetime-local" defaultValue={activity.endAt?.toISOString().slice(0, 16)} className="rounded-xl border border-slate-200 px-3 py-2" />
                <select name="status" defaultValue={activity.status} className="rounded-xl border border-slate-200 px-3 py-2">
                  <option value="published">已发布</option>
                  <option value="archived">已下架</option>
                </select>
                <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">保存活动</button>
              </form>
              <div className="mt-5 space-y-3">
                <h3 className="font-semibold text-slate-900">报名审核</h3>
                {activity.signups.length === 0 ? <p className="text-sm text-slate-500">暂无报名</p> : null}
                {activity.signups.map((signup) => (
                  <div key={signup.id} className="rounded-2xl bg-slate-50 p-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-slate-900">{signup.user.name}</p>
                        <p className="text-sm text-slate-500">{signup.reason || "未填写报名说明"} · {signupStatusMap[signup.status] ?? signup.status}</p>
                      </div>
                      {signup.status === "pending" ? (
                        <div className="flex gap-2">
                          <form action={reviewSignupAction}>
                            <input type="hidden" name="id" value={signup.id} />
                            <input type="hidden" name="status" value="approved" />
                            <button className="rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white">通过</button>
                          </form>
                          <form action={reviewSignupAction}>
                            <input type="hidden" name="id" value={signup.id} />
                            <input type="hidden" name="status" value="rejected" />
                            <button className="rounded-full bg-red-600 px-4 py-2 text-sm font-semibold text-white">拒绝</button>
                          </form>
                        </div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
