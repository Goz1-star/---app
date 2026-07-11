import { StudentShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function StudentAnnouncementsPage() {
  await requireRole("student");
  const announcements = await db.announcement.findMany({ orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }] });

  return (
    <StudentShell>
      <h1 className="text-3xl font-black text-slate-950">公告通知</h1>
      <div className="mt-6 grid gap-4">
        {announcements.map((item) => (
          <Card key={item.id}>
            <h2 className="text-xl font-bold text-slate-950">{item.isPinned ? "📌 " : ""}{item.title}</h2>
            <p className="mt-2 whitespace-pre-wrap text-slate-600">{item.content}</p>
            <p className="mt-3 text-xs text-slate-400">{formatDate(item.createdAt)}</p>
          </Card>
        ))}
      </div>
    </StudentShell>
  );
}
