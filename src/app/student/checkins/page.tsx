import { StudentShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { createCheckinAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";
import { formatDate } from "@/lib/utils";

export default async function StudentCheckinsPage() {
  const session = await requireRole("student");
  const checkins = await db.checkin.findMany({ where: { userId: session.userId }, orderBy: { createdAt: "desc" } });

  return (
    <StudentShell>
      <h1 className="text-3xl font-black text-slate-950">打卡</h1>
      <p className="mt-2 text-slate-600">打卡不需要地理位置、不需要管理员审核；允许补卡，补卡原因不强制。</p>
      <div className="mt-6 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <Card>
          <h2 className="text-xl font-bold">提交打卡</h2>
          <form action={createCheckinAction} className="mt-4 grid gap-3">
            <select name="type" className="rounded-2xl border border-slate-200 px-4 py-3">
              <option value="duration">时长打卡</option>
              <option value="photo">拍照打卡</option>
            </select>
            <input name="durationMin" type="number" placeholder="学习/参与时长（分钟）" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <textarea name="note" rows={3} placeholder="打卡说明" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <label className="flex items-center gap-2 text-sm text-slate-600"><input name="isMakeup" type="checkbox" /> 这是补卡</label>
            <input name="makeupReason" placeholder="补卡原因（不强制）" className="rounded-2xl border border-slate-200 px-4 py-3" />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">提交打卡</button>
          </form>
        </Card>
        <div className="grid gap-4">
          {checkins.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950">{item.type === "photo" ? "拍照打卡" : "时长打卡"}</h2>
                  <p className="mt-1 text-sm text-slate-500">{formatDate(item.createdAt)} · {item.durationMin ? `${item.durationMin} 分钟` : "未填写时长"}</p>
                  <p className="mt-2 text-slate-600">{item.note || "无说明"}</p>
                </div>
                {item.isMakeup ? <span className="h-fit rounded-full bg-brand-50 px-3 py-1 text-sm font-semibold text-brand-700">补卡</span> : null}
              </div>
              {item.makeupReason ? <p className="mt-3 text-sm text-slate-500">补卡原因：{item.makeupReason}</p> : null}
            </Card>
          ))}
        </div>
      </div>
    </StudentShell>
  );
}
