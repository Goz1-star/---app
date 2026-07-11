import { AdminShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { createQuizAction, createQuizQuestionAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const typeMap: Record<string, string> = {
  single: "单选",
  multiple: "多选",
  truefalse: "判断",
  short: "简答",
};

export default async function AdminQuizzesPage() {
  await requireRole("admin");
  const quizzes = await db.quiz.findMany({
    include: {
      questions: true,
      attempts: { include: { user: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell>
      <h1 className="text-3xl font-black text-slate-950">阶段性小测试</h1>
      <p className="mt-2 text-slate-600">支持单选、多选、判断、简答。客观题自动计分，简答题先记录答案。</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">创建测试</h2>
          <form action={createQuizAction} className="mt-4 grid gap-3">
            <input name="title" placeholder="测试标题" className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <textarea name="description" rows={4} placeholder="测试说明" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">创建测试</button>
          </form>
        </Card>

        <div className="grid gap-4">
          {quizzes.map((quiz) => (
            <Card key={quiz.id}>
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{quiz.title}</h2>
                  <p className="mt-2 text-slate-600">{quiz.description || "暂无说明"}</p>
                </div>
                <div className="text-right text-sm text-slate-500">
                  <p>{quiz.questions.length} 道题</p>
                  <p>{quiz.attempts.length} 次提交</p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl bg-slate-50 p-4">
                <h3 className="font-semibold text-slate-900">添加题目</h3>
                <form action={createQuizQuestionAction} className="mt-3 grid gap-3">
                  <input type="hidden" name="quizId" value={quiz.id} />
                  <select name="type" className="rounded-2xl border border-slate-200 px-4 py-3">
                    <option value="single">单选</option>
                    <option value="multiple">多选</option>
                    <option value="truefalse">判断</option>
                    <option value="short">简答</option>
                  </select>
                  <input name="title" placeholder="题目内容" className="rounded-2xl border border-slate-200 px-4 py-3" required />
                  <textarea name="options" rows={3} placeholder="选项：每行一个。判断/简答可不填" className="rounded-2xl border border-slate-200 px-4 py-3" />
                  <input name="answer" placeholder="答案。多选用逗号分隔，例如：A,B；判断填 true 或 false" className="rounded-2xl border border-slate-200 px-4 py-3" />
                  <input name="points" type="number" placeholder="分值" className="rounded-2xl border border-slate-200 px-4 py-3" defaultValue={1} />
                  <button className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white">添加题目</button>
                </form>
              </div>

              <div className="mt-5 space-y-2">
                {quiz.questions.map((question, index) => (
                  <div key={question.id} className="rounded-2xl border border-slate-100 p-3 text-sm text-slate-600">
                    <span className="font-semibold text-slate-950">{index + 1}. [{typeMap[question.type]}]</span> {question.title} · {question.points} 分
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
