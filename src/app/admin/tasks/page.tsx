import { readFile } from "node:fs/promises";
import { AdminShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { createTaskAction, reviewSubmissionAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

async function getPreview(path: string) {
  try {
    const text = await readFile(path, "utf8");
    return text.slice(0, 4000);
  } catch {
    return "暂无法预览该文件。";
  }
}

export default async function AdminTasksPage() {
  await requireRole("admin");
  const tasks = await db.task.findMany({
    include: { submissions: { include: { user: true, files: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <AdminShell>
      <h1 className="text-3xl font-black text-slate-950">任务与代码/文件提交</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-bold">创建任务</h2>
          <form action={createTaskAction} className="mt-4 grid gap-3">
            <input name="title" placeholder="任务标题" className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <textarea name="description" placeholder="任务说明" rows={4} className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <input name="points" type="number" placeholder="奖励积分" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">创建</button>
          </form>
        </Card>

        <div className="grid gap-4">
          {await Promise.all(tasks.map(async (task) => (
            <Card key={task.id}>
              <h2 className="text-xl font-bold text-slate-950">{task.title}</h2>
              <p className="mt-2 text-slate-600">{task.description}</p>
              <p className="mt-1 text-sm text-brand-700">奖励积分：{task.points}</p>
              <div className="mt-5 space-y-4">
                {task.submissions.length === 0 ? <p className="text-sm text-slate-500">暂无提交</p> : null}
                {await Promise.all(task.submissions.map(async (submission) => {
                  const previewFile = submission.files.find((file) => file.previewable);
                  const preview = previewFile ? await getPreview(previewFile.storagePath) : null;
                  return (
                    <div key={submission.id} className="rounded-2xl bg-slate-50 p-4">
                      <div className="flex flex-wrap justify-between gap-3">
                        <div>
                          <p className="font-semibold text-slate-900">{submission.user.name}</p>
                          <p className="text-xs text-slate-500">{formatDate(submission.createdAt)} · {submission.status}</p>
                        </div>
                        <p className="text-sm font-semibold text-brand-700">{submission.score ?? "未评分"}</p>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm text-slate-600">{submission.content}</p>
                      {submission.githubUrl ? <p className="mt-2 text-sm text-slate-600">GitHub：{submission.githubUrl} {submission.githubEnabled ? "（选择写入/关联）" : ""}</p> : null}
                      {submission.files.map((file) => (
                        <p key={file.id} className="mt-2 text-sm text-slate-500">附件：{file.originalName} · {(file.size / 1024).toFixed(1)} KB · {file.previewable ? "可预览" : "不可预览"}</p>
                      ))}
                      {preview ? <pre className="mt-3 max-h-80 overflow-auto rounded-2xl bg-slate-950 p-4 text-xs text-slate-100">{preview}</pre> : null}
                      <form action={reviewSubmissionAction} className="mt-3 grid gap-2 md:grid-cols-[120px_1fr_auto]">
                        <input type="hidden" name="id" value={submission.id} />
                        <input name="score" type="number" placeholder="分数" className="rounded-xl border border-slate-200 px-3 py-2" />
                        <input name="feedback" placeholder="反馈" className="rounded-xl border border-slate-200 px-3 py-2" />
                        <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">保存评价</button>
                      </form>
                    </div>
                  );
                }))}
              </div>
            </Card>
          )))}
        </div>
      </div>
    </AdminShell>
  );
}
