import { AdminShell } from "@/components/shell";
import { ButtonLink, Card } from "@/components/ui";
import { requireRole } from "@/lib/auth";

export default async function AdminExportPage() {
  await requireRole("admin");
  return (
    <AdminShell>
      <h1 className="text-3xl font-black text-slate-950">Excel 数据导出</h1>
      <Card className="mt-6">
        <h2 className="text-xl font-bold text-slate-950">导出范围</h2>
        <p className="mt-2 text-slate-600">首版只支持 Excel 格式，包含成员名单、打卡记录、报名审核和任务提交等核心数据。</p>
        <div className="mt-6">
          <ButtonLink href="/admin/export/download">下载 Excel</ButtonLink>
        </div>
      </Card>
    </AdminShell>
  );
}
