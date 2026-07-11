import Link from "next/link";
import { switchRoleAction } from "@/lib/actions-auth";
import { ButtonLink } from "@/components/ui";

const adminLinks = [
  ["首页", "/admin"],
  ["成员", "/admin/members"],
  ["公告", "/admin/announcements"],
  ["课程/活动", "/admin/activities"],
  ["任务提交", "/admin/tasks"],
  ["资料仓库", "/admin/materials"],
  ["小测试", "/admin/quizzes"],
  ["Excel 导出", "/admin/export"],
];

const studentLinks = [
  ["首页", "/student"],
  ["公告", "/student/announcements"],
  ["课程/活动", "/student/activities"],
  ["打卡", "/student/checkins"],
  ["任务", "/student/tasks"],
  ["资料", "/student/materials"],
  ["小测试", "/student/quizzes"],
  ["榜单", "/student/rankings"],
];

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <Link href="/admin" className="font-bold text-slate-950">无名小卒工坊 · 管理后台</Link>
          <nav className="hidden gap-2 md:flex">
            {adminLinks.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <form action={switchRoleAction.bind(null, "student")}>
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                切换为学员
              </button>
            </form>
            <ButtonLink href="/admin/login" variant="secondary">切换账号</ButtonLink>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-8">{children}</main>
    </div>
  );
}

export function StudentShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-white/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/student" className="font-bold text-slate-950">无名小卒工坊 · 学员端</Link>
          <nav className="hidden gap-2 md:flex">
            {studentLinks.map(([label, href]) => (
              <Link key={href} href={href} className="rounded-full px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 hover:text-slate-950">
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">
            <form action={switchRoleAction.bind(null, "admin")}>
              <button className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">
                切换为管理员
              </button>
            </form>
            <ButtonLink href="/student/login" variant="secondary">切换账号</ButtonLink>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
