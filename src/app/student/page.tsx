import { StudentShell } from "@/components/shell";
import { Card, StatCard } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function StudentPage() {
  const session = await requireRole("student");
  const [announcements, activities, checkins, tasks, profile, materials, quizzes] = await Promise.all([
    db.announcement.count(),
    db.activity.count({ where: { status: "published" } }),
    db.checkin.count({ where: { userId: session.userId } }),
    db.task.count(),
    db.memberProfile.findUnique({ where: { userId: session.userId } }),
    db.material.count(),
    db.quiz.count(),
  ]);

  return (
    <StudentShell>
      <div className="mb-8">
        <p className="text-sm font-semibold text-brand-700">你好，{session.user.name}</p>
        <h1 className="mt-2 text-4xl font-black text-slate-950">学员首页</h1>
        <p className="mt-3 text-slate-600">完成报名、打卡、任务提交、代码上传和阶段性成长记录。</p>
      </div>
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
        <StatCard label="公告" value={announcements} />
        <StatCard label="课程/活动" value={activities} />
        <StatCard label="我的打卡" value={checkins} />
        <StatCard label="可提交任务" value={tasks} />
        <StatCard label="资料" value={materials} />
        <StatCard label="小测试" value={quizzes} />
        <StatCard label="我的积分" value={profile?.points ?? 0} />
      </div>
      <Card className="mt-8">
        <h2 className="text-xl font-bold text-slate-950">今日建议</h2>
        <p className="mt-2 text-slate-600">先查看公告、课程活动和资料仓库，再完成打卡。如果有任务或小测试，及时提交代码文件、GitHub 链接或测试答案。</p>
      </Card>
    </StudentShell>
  );
}
