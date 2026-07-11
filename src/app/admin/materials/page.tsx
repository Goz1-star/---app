import { AdminShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { createMaterialAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function AdminMaterialsPage() {
  await requireRole("admin");
  const materials = await db.material.findMany({ include: { uploader: true }, orderBy: { createdAt: "desc" } });

  return (
    <AdminShell>
      <h1 className="text-3xl font-black text-slate-950">资料仓库管理</h1>
      <p className="mt-2 text-slate-600">管理员维护学习资料，学员端可查看和打开资料链接。</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">新增资料</h2>
          <form action={createMaterialAction} className="mt-4 grid gap-3">
            <input name="title" placeholder="资料标题" className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <input name="category" placeholder="分类，例如：前端 / Java / 数据库" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <input name="url" placeholder="资料链接" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <textarea name="description" placeholder="资料说明" rows={4} className="rounded-2xl border border-slate-200 px-4 py-3" />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">保存资料</button>
          </form>
        </Card>

        <div className="grid gap-4">
          {materials.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <p className="mb-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{item.category}</p>
                  <h2 className="text-xl font-bold text-slate-950">{item.title}</h2>
                  <p className="mt-2 text-slate-600">{item.description || "暂无说明"}</p>
                  <p className="mt-3 text-xs text-slate-400">{item.uploader.name} · {formatDate(item.createdAt)}</p>
                </div>
                {item.url ? <a href={item.url} target="_blank" className="rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">打开</a> : null}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
