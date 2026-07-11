import { StudentShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function StudentMaterialsPage() {
  await requireRole("student");
  const materials = await db.material.findMany({ include: { uploader: true }, orderBy: { createdAt: "desc" } });

  return (
    <StudentShell>
      <h1 className="text-3xl font-black text-slate-950">资料仓库</h1>
      <p className="mt-2 text-slate-600">查看工作室沉淀的课程资料、学习链接和项目参考内容。</p>
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        {materials.map((item) => (
          <Card key={item.id}>
            <p className="mb-2 inline-flex rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-700">{item.category}</p>
            <h2 className="text-xl font-bold text-slate-950">{item.title}</h2>
            <p className="mt-2 min-h-12 text-slate-600">{item.description || "暂无说明"}</p>
            <p className="mt-3 text-xs text-slate-400">{item.uploader.name} · {formatDate(item.createdAt)}</p>
            {item.url ? (
              <a href={item.url} target="_blank" className="mt-5 inline-flex rounded-full bg-slate-950 px-4 py-2 text-sm font-semibold text-white">
                打开资料
              </a>
            ) : null}
          </Card>
        ))}
      </div>
    </StudentShell>
  );
}
