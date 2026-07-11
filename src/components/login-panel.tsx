import { mockOtpAction, otpLoginAction, passwordLoginAction } from "@/lib/actions-auth";
import type { ActiveRole } from "@/lib/auth";
import { Card } from "@/components/ui";

export function LoginPanel({ role, title, subtitle, error, sentPhone }: { role: ActiveRole; title: string; subtitle: string; error?: string; sentPhone?: string }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center px-6 py-12">
      <div className="grid w-full gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <section>
          <p className="mb-4 inline-flex rounded-full bg-white/80 px-4 py-2 text-sm font-semibold text-brand-700 shadow-sm">
            {role === "admin" ? "Web 管理后台" : "普通室员入口"}
          </p>
          <h1 className="text-5xl font-black tracking-tight text-slate-950">{title}</h1>
          <p className="mt-4 text-lg leading-8 text-slate-600">{subtitle}</p>
          <div className="mt-6 rounded-2xl bg-white/70 p-4 text-sm text-slate-600">
            <p className="font-semibold text-slate-900">测试账号</p>
            <p>管理员：18800000001 / 123456</p>
            <p>学员：18800000002 / 123456</p>
            <p>双身份：18800000003 / 123456</p>
            <p>模拟验证码：123456</p>
          </div>
        </section>

        <Card className="space-y-6">
          {error ? <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div> : null}
          {sentPhone ? <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">已为 {sentPhone} 生成模拟验证码：123456</div> : null}

          <div>
            <h2 className="text-xl font-bold text-slate-950">账号密码登录</h2>
            <form action={passwordLoginAction.bind(null, role)} className="mt-4 grid gap-3">
              <input name="phone" placeholder="手机号" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500" required />
              <input name="password" placeholder="密码" type="password" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500" required />
              <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white hover:bg-brand-700">登录</button>
            </form>
          </div>

          <div className="border-t border-slate-100 pt-6">
            <h2 className="text-xl font-bold text-slate-950">手机号模拟验证码登录</h2>
            <form action={mockOtpAction.bind(null, role)} className="mt-4 flex gap-2">
              <input name="phone" defaultValue={sentPhone} placeholder="手机号" className="min-w-0 flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500" required />
              <button className="rounded-2xl border border-slate-200 bg-white px-4 py-3 font-semibold text-slate-700 hover:bg-slate-50">获取</button>
            </form>
            {sentPhone ? (
              <form action={otpLoginAction.bind(null, role)} className="mt-3 grid gap-3">
                <input type="hidden" name="phone" value={sentPhone} />
                <input name="code" placeholder="验证码，默认 123456" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-brand-500" required />
                <button className="rounded-2xl bg-slate-950 px-4 py-3 font-semibold text-white hover:bg-slate-800">验证码登录</button>
              </form>
            ) : (
              <p className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm text-slate-500">先填写手机号并点击“获取”，再输入验证码 123456 登录。</p>
            )}
          </div>
        </Card>
      </div>
    </main>
  );
}
