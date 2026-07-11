import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { readPreview } from "@/lib/files";

export default async function AdminFilePreviewPage({ params }: { params: Promise<{ fileId: string }> }) {
  await requireRole("admin");
  const { fileId } = await params;
  const file = await db.uploadFile.findUnique({ where: { id: fileId }, include: { submission: { include: { task: true, user: true } } } });
  if (!file || !file.previewable) notFound();

  const preview = await readPreview(file.storagePath).catch(() => "暂无法预览该文件内容。");

  return (
    <AdminShell>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-950">代码文件预览</h1>
          <p className="mt-2 text-slate-600">{file.originalName}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/tasks" className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700">返回任务</Link>
          <a href={`/api/files/${file.id}/download`} className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">下载文件</a>
        </div>
      </div>
      <Card>
        <p className="mb-3 text-sm text-slate-500">
          {file.submission ? `${file.submission.user.name} · ${file.submission.task.title}` : "资料文件"}
        </p>
        <pre className="max-h-[70vh] overflow-auto rounded-2xl bg-slate-950 p-5 text-xs leading-6 text-slate-100">{preview}</pre>
      </Card>
    </AdminShell>
  );
}
