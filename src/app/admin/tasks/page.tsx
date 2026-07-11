import { AdminShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { createTaskAction, retrySubmissionGitHubSyncAction, reviewSubmissionAction, updateTaskAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatFileSize } from "@/lib/files";
import { formatDate } from "@/lib/utils";

const taskStatusMap: Record<string, string> = {
  published: "可提交",
  archived: "已归档",
};

const githubSyncStatusMap: Record<string, { label: string; className: string }> = {
  not_requested: { label: "未请求", className: "bg-slate-100 text-slate-600" },
  pending: { label: "同步中", className: "bg-amber-50 text-amber-700" },
  success: { label: "已同步", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "同步失败", className: "bg-red-50 text-red-700" },
  skipped: { label: "已跳过", className: "bg-slate-100 text-slate-600" },
};

function GitHubSyncBadge({ status }: { status: string }) {
  const item = githubSyncStatusMap[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
  return <span className={`rounded-full px-3 py-1 text-xs font-semibold ${item.className}`}>{item.label}</span>;
}

function canRetryGitHubSync(status: string, enabled: boolean) {
  return enabled || ["failed", "skipped", "pending"].includes(status);
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
            <input name="dueAt" type="datetime-local" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">创建</button>
          </form>
        </Card>

        <div className="grid gap-4">
          {tasks.map((task) => (
            <Card key={task.id}>
              <h2 className="text-xl font-bold text-slate-950">{task.title}</h2>
              <p className="mt-2 text-slate-600">{task.description}</p>
              <p className="mt-1 text-sm text-brand-700">奖励积分：{task.points} · {taskStatusMap[task.status] ?? task.status} · 截止：{formatDate(task.dueAt)}</p>
              <form action={updateTaskAction} className="mt-5 grid gap-3 rounded-2xl bg-slate-50 p-4">
                <input type="hidden" name="id" value={task.id} />
                <input name="title" defaultValue={task.title} className="rounded-xl border border-slate-200 px-3 py-2" required />
                <textarea name="description" defaultValue={task.description} rows={3} className="rounded-xl border border-slate-200 px-3 py-2" required />
                <input name="points" type="number" defaultValue={task.points} className="rounded-xl border border-slate-200 px-3 py-2" />
                <input name="dueAt" type="datetime-local" defaultValue={task.dueAt?.toISOString().slice(0, 16)} className="rounded-xl border border-slate-200 px-3 py-2" />
                <select name="status" defaultValue={task.status} className="rounded-xl border border-slate-200 px-3 py-2">
                  <option value="published">可提交</option>
                  <option value="archived">已归档</option>
                </select>
                <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">保存任务</button>
              </form>
              <div className="mt-5 space-y-4">
                {task.submissions.length === 0 ? <p className="text-sm text-slate-500">暂无提交</p> : null}
                {task.submissions.map((submission) => {
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
                      {submission.githubUrl ? <p className="mt-2 text-sm text-slate-600">学员 GitHub 链接：{submission.githubUrl} {submission.githubEnabled ? "（选择写入/关联）" : ""}</p> : null}
                      <div className="mt-3 rounded-2xl bg-white p-3 text-sm text-slate-600">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">GitHub 同步状态</span>
                          <GitHubSyncBadge status={submission.githubSyncStatus} />
                        </div>
                        {submission.githubSyncMessage ? <p className="mt-2">说明：{submission.githubSyncMessage}</p> : null}
                        {submission.githubSyncPath ? <p className="mt-1 break-all">路径：{submission.githubSyncPath}</p> : null}
                        {submission.githubSyncUrl ? (
                          <p className="mt-1 break-all">
                            系统写入链接：<a href={submission.githubSyncUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-700">{submission.githubSyncUrl}</a>
                          </p>
                        ) : null}
                        <p className="mt-1 text-xs text-slate-500">
                          最近尝试：{formatDate(submission.githubLastAttemptAt)} · 成功同步：{formatDate(submission.githubSyncedAt)}
                        </p>
                        {canRetryGitHubSync(submission.githubSyncStatus, submission.githubEnabled) ? (
                          <form action={retrySubmissionGitHubSyncAction} className="mt-3">
                            <input type="hidden" name="id" value={submission.id} />
                            <button className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50">重试 GitHub 同步</button>
                          </form>
                        ) : null}
                      </div>
                      {submission.files.map((file) => (
                        <div key={file.id} className="mt-2 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white p-3 text-sm text-slate-500">
                          <span>附件：{file.originalName} · {formatFileSize(file.size)} · {file.previewable ? "可预览" : "不可预览"}</span>
                          <div className="flex gap-2">
                            {file.previewable ? <a href={`/admin/files/${file.id}/preview`} className="font-semibold text-brand-700">独立预览</a> : null}
                            <a href={`/api/files/${file.id}/download`} className="font-semibold text-slate-900">下载</a>
                          </div>
                        </div>
                      ))}
                      <form action={reviewSubmissionAction} className="mt-3 grid gap-2 md:grid-cols-[120px_1fr_auto]">
                        <input type="hidden" name="id" value={submission.id} />
                        <input name="score" type="number" placeholder="分数" className="rounded-xl border border-slate-200 px-3 py-2" />
                        <input name="feedback" placeholder="反馈" className="rounded-xl border border-slate-200 px-3 py-2" />
                        <button className="rounded-xl bg-slate-950 px-4 py-2 text-sm font-semibold text-white">保存评价</button>
                      </form>
                    </div>
                  );
                })}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
