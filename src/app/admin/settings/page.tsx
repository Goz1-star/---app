import { AdminShell } from "@/components/shell";
import { Card } from "@/components/ui";
import { saveSystemSettingAction } from "@/lib/actions";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

const DEFAULTS = {
  basic_info: {
    studioName: "无名小卒工坊",
    studioIntro: "软件技术专业学校工作室，专注成员学习、任务提交、打卡和成长激励。",
    contact: "室长/管理员",
  },
  operation_rules: {
    activitySignupRule: "课程/活动需要报名审核，管理员通过后正式参与。",
    reviewRule: "打卡不需要地理位置，不需要管理员审核，允许补卡且补卡原因不强制。",
    pointsRule: "积分可由打卡、任务、小测试和管理员手动奖惩产生。",
  },
  upload_rules: {
    supportedFileTypes: "代码、压缩包、文档、图片、GitHub 链接。",
    codeFileLimit: "代码文件最大 200MB，其他文件首版不设置特殊大小限制。",
    previewRule: "代码文件支持在线预览，不做在线编译和运行。",
    githubRule: "GitHub 为首版唯一支持的外部代码平台，写入/关联可选。",
  },
};

type SectionKey = keyof typeof DEFAULTS;

function parseSetting(section: SectionKey, raw?: string) {
  if (!raw) return DEFAULTS[section];
  try {
    return { ...DEFAULTS[section], ...JSON.parse(raw) };
  } catch {
    return DEFAULTS[section];
  }
}

function TextInput({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <input name={name} defaultValue={defaultValue} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-900" />
    </label>
  );
}

function TextArea({ name, label, defaultValue }: { name: string; label: string; defaultValue: string }) {
  return (
    <label className="grid gap-2 text-sm font-semibold text-slate-700">
      {label}
      <textarea name={name} defaultValue={defaultValue} rows={4} className="rounded-2xl border border-slate-200 px-4 py-3 font-normal text-slate-900" />
    </label>
  );
}

export default async function AdminSettingsPage() {
  await requireRole("admin");
  const settings = await db.systemSetting.findMany();
  const bySection = Object.fromEntries(settings.map((item) => [item.section, item.valueJson]));
  const basic = parseSetting("basic_info", bySection.basic_info);
  const operation = parseSetting("operation_rules", bySection.operation_rules);
  const upload = parseSetting("upload_rules", bySection.upload_rules);

  return (
    <AdminShell>
      <h1 className="text-3xl font-black text-slate-950">系统设置</h1>
      <p className="mt-2 text-slate-600">第一版设置只用于保存与展示，暂不影响打卡积分、上传限制、报名审核等实际业务逻辑。</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <Card>
          <h2 className="text-xl font-bold text-slate-950">基础信息</h2>
          <form action={saveSystemSettingAction} className="mt-4 grid gap-3">
            <input type="hidden" name="section" value="basic_info" />
            <TextInput name="studioName" label="工作室名称" defaultValue={basic.studioName} />
            <TextArea name="studioIntro" label="工作室简介" defaultValue={basic.studioIntro} />
            <TextInput name="contact" label="联系方式/负责人" defaultValue={basic.contact} />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">保存基础信息</button>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">运营规则</h2>
          <form action={saveSystemSettingAction} className="mt-4 grid gap-3">
            <input type="hidden" name="section" value="operation_rules" />
            <TextArea name="activitySignupRule" label="活动报名说明" defaultValue={operation.activitySignupRule} />
            <TextArea name="reviewRule" label="审核/打卡说明" defaultValue={operation.reviewRule} />
            <TextArea name="pointsRule" label="积分说明" defaultValue={operation.pointsRule} />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">保存运营规则</button>
          </form>
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-slate-950">上传规则</h2>
          <form action={saveSystemSettingAction} className="mt-4 grid gap-3">
            <input type="hidden" name="section" value="upload_rules" />
            <TextArea name="supportedFileTypes" label="支持文件类型" defaultValue={upload.supportedFileTypes} />
            <TextInput name="codeFileLimit" label="代码文件大小限制" defaultValue={upload.codeFileLimit} />
            <TextArea name="previewRule" label="代码预览说明" defaultValue={upload.previewRule} />
            <TextArea name="githubRule" label="GitHub 规则" defaultValue={upload.githubRule} />
            <button className="rounded-2xl bg-brand-600 px-4 py-3 font-semibold text-white">保存上传规则</button>
          </form>
        </Card>
      </div>
    </AdminShell>
  );
}
