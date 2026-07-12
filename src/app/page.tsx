import Link from "next/link";
import { ButtonLink, Card } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col justify-center px-6 py-16">
      <div className="grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
        <section>
          <p className="mb-4 inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm">
            无名小卒工坊管理 App
          </p>
          <h1 className="text-5xl font-black tracking-tight text-slate-950 md:text-7xl">无名小卒工坊</h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            管理员负责成员、课程、公告、任务、代码提交与数据导出；普通室员完成打卡、报名、任务提交、资料学习、榜单查看和阶段性测试。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/admin/login">管理员登录</ButtonLink>
            <ButtonLink href="/student/login" variant="secondary">学员登录</ButtonLink>
            <Link href="/CLAUDE.md" className="inline-flex items-center text-sm font-semibold text-slate-500 hover:text-slate-950">
              查看产品文档
            </Link>
          </div>
        </section>
        <Card className="space-y-4">
          <h2 className="text-xl font-bold text-slate-950">MVP 功能</h2>
          <ul className="grid gap-3 text-sm text-slate-600">
            <li>双登录入口与角色权限隔离</li>
            <li>成员、公告、课程/活动报名审核</li>
            <li>拍照/时长打卡，允许补卡且原因不强制</li>
            <li>任务、代码/文件上传、GitHub 链接提交</li>
            <li>代码在线预览、200MB 代码文件限制</li>
            <li>全员榜单、阶段性小测试、Excel 导出</li>
          </ul>
        </Card>
      </div>
    </main>
  );
}
