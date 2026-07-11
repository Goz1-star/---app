import { notFound } from "next/navigation";
import { StudentShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { submitQuizAttemptAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

function parseOptions(options: string | null) {
  if (!options) return [];
  try {
    const parsed = JSON.parse(options);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function QuestionInput({ question }: { question: { id: string; type: string; title: string; options: string | null; points: number } }) {
  const name = `question_${question.id}`;
  const options = parseOptions(question.options);

  if (question.type === "truefalse") {
    return (
      <div className="mt-3 flex gap-3 text-sm text-slate-700">
        <label className="rounded-full border border-slate-200 bg-white px-4 py-2"><input type="radio" name={name} value="true" required /> 正确</label>
        <label className="rounded-full border border-slate-200 bg-white px-4 py-2"><input type="radio" name={name} value="false" required /> 错误</label>
      </div>
    );
  }

  if (question.type === "short") {
    return <textarea name={name} rows={4} placeholder="填写简答答案" className="mt-3 w-full rounded-2xl border border-slate-200 px-4 py-3" />;
  }

  if (question.type === "multiple") {
    return (
      <div className="mt-3 grid gap-2 text-sm text-slate-700">
        {options.map((option) => (
          <label key={option} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
            <input type="checkbox" name={name} value={option} /> {option}
          </label>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-3 grid gap-2 text-sm text-slate-700">
      {options.map((option) => (
        <label key={option} className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
          <input type="radio" name={name} value={option} required /> {option}
        </label>
      ))}
    </div>
  );
}

export default async function StudentQuizDetailPage({ params }: { params: Promise<{ quizId: string }> }) {
  await requireRole("student");
  const { quizId } = await params;
  const quiz = await db.quiz.findUnique({ where: { id: quizId }, include: { questions: true } });
  if (!quiz) notFound();

  return (
    <StudentShell>
      <h1 className="text-3xl font-black text-slate-950">{quiz.title}</h1>
      <p className="mt-2 text-slate-600">{quiz.description || "完成后提交答案。"}</p>
      <form action={submitQuizAttemptAction} className="mt-6 grid gap-4">
        <input type="hidden" name="quizId" value={quiz.id} />
        {quiz.questions.map((question, index) => (
          <Card key={question.id}>
            <div className="flex justify-between gap-4">
              <h2 className="font-bold text-slate-950">{index + 1}. {question.title}</h2>
              <span className="text-sm font-semibold text-brand-700">{question.points} 分</span>
            </div>
            <QuestionInput question={question} />
          </Card>
        ))}
        <button className="rounded-2xl bg-brand-600 px-5 py-4 font-semibold text-white">提交测试</button>
      </form>
    </StudentShell>
  );
}
