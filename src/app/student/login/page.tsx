import { LoginPanel } from "@/components/login-panel";

export default async function StudentLoginPage({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; phone?: string }> }) {
  const params = await searchParams;
  return (
    <LoginPanel
      role="student"
      title="学员登录"
      subtitle="普通室员从这里进入，完成课程报名、打卡、任务提交、代码上传、榜单查看和阶段性测试。"
      error={params.error}
      sentPhone={params.sent ? params.phone : undefined}
    />
  );
}
