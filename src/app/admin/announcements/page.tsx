import { AdminShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { createAnnouncementAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function AdminAnnouncementsPage() {
  await requireRole("admin");
  const announcements = await db.announcement.findMany({ include: { author: true }, orderBy: { createdAt: "desc" } });

  return (
    <AdminShell>
      <h1 className="text-3xl font-black text-slate-950">公告管理</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-bold">发布公告</h2>
          <form action={createAnnouncementAction} className="mt-4 grid gap-3">
            <input name="title" placeholder="公告标题" className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <textarea name="content" placeholder="公告内容" rows={5} className="rounded-2xl border border-slate-200 px-4 py-3" required />
            <label className="flex items-center gap-2 text-sm text-slate-600"><input name="isPinned" type="checkbox" /> 置顶公告</label>
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">发布</button>
          </form>
        </Card>
        <div className="grid gap-4">
          {announcements.map((item) => (
            <Card key={item.id}>
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-950">{item.isPinned ? "📌 " : ""}{item.title}</h2>
                  <p className="mt-2 whitespace-pre-wrap text-slate-600">{item.content}</p>
                </div>
                <p className="text-xs text-slate-400">{formatDate(item.createdAt)}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AdminShell>
  );
}
