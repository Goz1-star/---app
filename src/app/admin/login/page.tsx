import { LoginPanel } from "@/components/login-panel";

export default async function AdminLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; phone?: string }> }) {
  const params = await searchParams;
  return (
    <LoginPanel
      role="admin"
      title="管理员登录"
      subtitle="仅室长/管理员可进入 Web 管理后台，管理成员、课程、公告、任务、代码提交和 Excel 导出。"
      error={params.error}
      sentPhone={params.sent ? params.phone : undefined}
    />
  );
}
