import { StudentShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatFileSize } from "@/lib/files";
import { formatDate } from "@/lib/utils";

export default async function StudentMaterialsPage({ searchParams }: { searchParams: Promise<{ q?: string; category?: string; sort?: string }> }) {
  await requireRole("student");
  const params = await searchParams;
  const q = (params.q ?? "").trim();
  const category = (params.category ?? "").trim();
  const sort = params.sort === "oldest" ? "asc" : "desc";
  const where = {
    ...(category ? { category } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q } },
            { description: { contains: q } },
            { category: { contains: q } },
          ],
        }
      : {}),
  };
  const [materials, categories] = await Promise.all([
    db.material.findMany({ where, include: { uploader: true, files: true }, orderBy: { createdAt: sort } }),
    db.material.findMany({ select: { category: true }, distinct: ["category"], orderBy: { category: "asc" } }),
  ]);

  return (
    <StudentShell>
      <h1 className="text-3xl font-black text-slate-950">资料仓库</h1>
      <p className="mt-2 text-slate-600">查看工作室沉淀的课程资料、学习链接和项目参考内容。</p>
      <form className="mt-6 grid gap-3 rounded-3xl border border-white/80 bg-white/80 p-4 shadow-soft md:grid-cols-[1fr_180px_140px_auto]">
        <input name="q" defaultValue={q} placeholder="搜索标题、说明或分类" className="rounded-2xl border border-slate-200 px-4 py-3" />
        <select name="category" defaultValue={category} className="rounded-2xl border border-slate-200 px-4 py-3">
          <option value="">全部分类</option>
          {categories.map((item) => (
            <option key={item.category} value={item.category}>{item.category}</option>
          ))}
        </select>
        <select name="sort" defaultValue={params.sort ?? "newest"} className="rounded-2xl border border-slate-200 px-4 py-3">
          <option value="newest">最新优先</option>
          <option value="oldest">最早优先</option>
        </select>
        <button className="rounded-2xl bg-slate-950 px-5 py-3 font-semibold text-white">筛选</button>
      </form>
      <div className="mt-4 text-sm text-slate-500">共找到 {materials.length} 条资料</div>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {materials.map((item) => (
          <Card key={item.id}>
            <p className="mb-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{item.category}</p>
            <h2 className="text-xl font-bold text-slate-950">{item.title}</h2>
            <p className="mt-2 min-h-12 text-slate-600">{item.description || "暂无说明"}</p>
            <p className="mt-3 text-xs text-slate-400">{item.uploader.name} · {formatDate(item.createdAt)}</p>
            {item.url ? (
              <a href={item.url} target="_blank" className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                打开链接
              </a>
            ) : null}
            {item.files.length ? (
              <div className="mt-4 space-y-2">
                {item.files.map((file) => (
                  <div key={file.id} className="rounded-2xl bg-slate-50 p-3 text-sm text-slate-600">
                    <p>{file.originalName} · {formatFileSize(file.size)}</p>
                    <div className="mt-2 flex gap-3">
                      {file.previewable ? <a href={`/student/files/${file.id}/preview`} className="font-semibold text-brand-700">预览</a> : null}
                      <a href={`/api/files/${file.id}/download`} className="font-semibold text-slate-900">下载</a>
                    </div>
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
