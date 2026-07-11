import Link from "next/link";
import { StudentShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export default async function StudentQuizzesPage() {
  const session = await requireRole("student");
  const quizzes = await db.quiz.findMany({
    include: {
      questions: true,
      attempts: { where: { userId: session.userId }, include: { answers: true }, orderBy: { createdAt: "desc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <StudentShell>
      <h1 className="text-3xl font-black text-slate-950">阶段性小测试</h1>
      <p className="mt-2 text-slate-600">完成阶段性测试，客观题会自动计分，简答题会保存答案。</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {quizzes.map((quiz) => {
          const latestAttempt = quiz.attempts[0];
          return (
            <Card key={quiz.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{quiz.title}</h2>
                  <p className="mt-2 text-slate-600">{quiz.description || "暂无说明"}</p>
                </div>
                <span className="rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">{quiz.questions.length} 题</span>
              </div>
              {latestAttempt ? (
                <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
                  <p>已提交，最近得分：{latestAttempt.score ?? 0}</p>
                  {latestAttempt.answers.some((answer) => answer.score === null) ? <p className="mt-1">部分简答题待管理员批改。</p> : null}
                </div>
              ) : (
                <p className="mt-4 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">尚未提交</p>
              )}
              <Link href={`/student/quizzes/${quiz.id}`} className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                {latestAttempt ? "再次答题" : "开始答题"}
              </Link>
            </Card>
          );
        })}
      </div>
    </StudentShell>
  );
}
