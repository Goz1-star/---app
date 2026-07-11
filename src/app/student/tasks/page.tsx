import { StudentShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { submitTaskAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatFileSize } from "@/lib/files";
import { formatDate } from "@/lib/utils";

const githubSyncStatusMap: Record<string, { label: string; className: string }> = {
  not_requested: { label: "未请求", className: "bg-slate-100 text-slate-600" },
  pending: { label: "同步中", className: "bg-amber-50 text-amber-700" },
  success: { label: "已同步", className: "bg-emerald-50 text-emerald-700" },
  failed: { label: "同步失败", className: "bg-red-50 text-red-700" },
  skipped: { label: "已跳过", className: "bg-slate-100 text-slate-600" },
};

function GitHubSyncBadge({ status }: { status: string }) {
  const item = githubSyncStatusMap[status] ?? { label: status, className: "bg-slate-100 text-slate-600" };
  return <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${item.className}`}>{item.label}</span>;
}

export default async function StudentTasksPage() {
  const session = await requireRole("student");
  const tasks = await db.task.findMany({
    where: { status: "published" },
    include: { submissions: { where: { userId: session.userId }, include: { files: true } } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <StudentShell>
      <h1 className="text-3xl font-black text-slate-950">任务提交</h1>
      <p className="mt-2 text-slate-600">可提交文本、代码文件、压缩包、文档、图片或 GitHub 链接；GitHub 写入/关联可选。</p>
      <div className="mt-6 grid gap-4">
        {tasks.map((task) => (
          <Card key={task.id}>
            <div className="flex flex-wrap justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-slate-950">{task.title}</h2>
                <p className="mt-2 text-slate-600">{task.description}</p>
                <p className="mt-2 text-sm text-slate-500">截止时间：{formatDate(task.dueAt)}</p>
              </div>
              <span className="h-fit rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">{task.points} 积分</span>
            </div>
            <form action={submitTaskAction} className="mt-4 grid gap-3" encType="multipart/form-data">
              <input type="hidden" name="taskId" value={task.id} />
              <textarea name="content" rows={3} placeholder="提交说明" className="rounded-2xl border border-slate-200 px-4 py-3" />
              <input name="githubUrl" placeholder="GitHub 仓库链接（可选）" className="rounded-2xl border border-slate-200 px-4 py-3" />
              <label className="flex items-center gap-2 text-sm text-slate-600"><input name="githubEnabled" type="checkbox" /> 选择写入/关联 GitHub</label>
              <input name="files" type="file" multiple className="rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-3 text-sm" />
              <p className="text-xs text-slate-500">代码文件最大 200MB；代码文件支持在线预览。</p>
              <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">提交任务</button>
            </form>
            {task.submissions.length ? (
              <div className="mt-5 space-y-3">
                <h3 className="font-semibold text-slate-900">我的提交</h3>
                {task.submissions.map((submission) => (
                  <div key={submission.id} className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
                    <p>{formatDate(submission.createdAt)} · {submission.status} · {submission.score ?? "未评分"}</p>
                    {submission.feedback ? <p className="mt-1">反馈：{submission.feedback}</p> : null}
                    {submission.githubUrl ? <p className="mt-1 break-all">学员 GitHub 链接：{submission.githubUrl}</p> : null}
                    {submission.githubEnabled || submission.githubSyncStatus !== "not_requested" ? (
                      <div className="mt-2 rounded-2xl bg-white p-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-900">GitHub 同步</span>
                          <GitHubSyncBadge status={submission.githubSyncStatus} />
                        </div>
                        {submission.githubSyncMessage ? <p className="mt-1">{submission.githubSyncMessage}</p> : null}
                        {submission.githubSyncUrl ? (
                          <p className="mt-1 break-all">
                            系统写入链接：<a href={submission.githubSyncUrl} target="_blank" rel="noreferrer" className="font-semibold text-brand-700">{submission.githubSyncUrl}</a>
                          </p>
                        ) : null}
                      </div>
                    ) : null}
                    {submission.files.map((file) => (
                      <p key={file.id} className="mt-1">
                        附件：{file.originalName} · {formatFileSize(file.size)}
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ) : null}
          </Card>
        ))}
      </div>
    </StudentShell>
  );
}
