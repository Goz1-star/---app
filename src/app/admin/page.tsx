import { AdminShell } from "@/components/shell";
import { StatCard, Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function AdminPage() {
  const session = await requireRole("admin");
  const [members, announcements, pendingSignups, submissions, checkins, materials, quizzes] = await Promise.all([
    db.memberProfile.count(),
    db.announcement.count(),
    db.activitySignup.count({ where: { status: "pending" } }),
    db.taskSubmission.count(),
    db.checkin.count(),
    db.material.count(),
    db.quiz.count(),
  ]);

  return (
    <AdminShell>
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-700">欢迎回来，{session.user.name}</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">管理员首页</h1>
        <p className="mt-3 text-slate-600">Web 管理后台只给管理员使用，用于管理工作室日常运营。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <StatCard label="室员数" value={members} />
        <StatCard label="公告" value={announcements} />
        <StatCard label="待审核报名" value={pendingSignups} />
        <StatCard label="任务提交" value={submissions} />
        <StatCard label="打卡记录" value={checkins} />
        <StatCard label="资料" value={materials} />
        <StatCard label="小测试" value={quizzes} />
      </div>
      <Card className="mt-8">
        <h2 className="text-xl font-bold text-slate-950">系统设置</h2>
        <p className="mt-2 text-slate-600">可以在系统设置中保存工作室基础信息、运营规则和上传规则。第一版仅保存和展示，不影响实际业务逻辑。</p>
        <a href="/admin/settings" className="mt-4 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">进入设置</a>
      </Card>
      <Card className="mt-4">
        <h2 className="text-xl font-bold text-slate-950">开发中的 MVP 模块</h2>
        <p className="mt-2 text-slate-600">当前已搭建成员、公告、课程报名审核、任务提交、资料仓库、阶段性小测试、打卡、榜单和 Excel 导出入口。</p>
      </Card>
    </AdminShell>
  );
}
