import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function ensureRole(key: string, name: string, description: string) {
  return prisma.role.upsert({
    where: { key },
    update: { name, description },
    create: { key, name, description },
  });
}

async function ensureUser(input: {
  name: string;
  phone: string;
  email?: string;
  roles: string[];
  studentNo?: string;
  points?: number;
}) {
  const passwordHash = await bcrypt.hash("123456", 10);
  const user = await prisma.user.upsert({
    where: { phone: input.phone },
    update: {
      name: input.name,
      email: input.email,
      passwordHash,
      status: "active",
    },
    create: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      passwordHash,
      status: "active",
    },
  });

  for (const roleKey of input.roles) {
    const role = await prisma.role.findUniqueOrThrow({ where: { key: roleKey } });
    await prisma.userRole.upsert({
      where: { userId_roleId: { userId: user.id, roleId: role.id } },
      update: {},
      create: { userId: user.id, roleId: role.id },
    });
  }

  if (input.roles.includes("student")) {
    await prisma.memberProfile.upsert({
      where: { userId: user.id },
      update: {
        studentNo: input.studentNo,
        points: input.points ?? 0,
      },
      create: {
        userId: user.id,
        studentNo: input.studentNo,
        points: input.points ?? 0,
        grade: "2026级",
        major: "软件技术",
      },
    });
  }

  return user;
}

async function main() {
  await prisma.quizAnswer.deleteMany();
  await prisma.quizAttempt.deleteMany();
  await prisma.quizQuestion.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.uploadFile.deleteMany();
  await prisma.taskSubmission.deleteMany();
  await prisma.task.deleteMany();
  await prisma.pointLedger.deleteMany();
  await prisma.checkin.deleteMany();
  await prisma.activitySignup.deleteMany();
  await prisma.activity.deleteMany();
  await prisma.announcement.deleteMany();
  await prisma.material.deleteMany();

  await ensureRole("admin", "管理员", "室长或被授权的工作室管理员");
  await ensureRole("student", "普通室员", "参与学习、任务、打卡和测试的工作室成员");

  await prisma.systemSetting.upsert({
    where: { section: "github_config" },
    update: {
      valueJson: JSON.stringify({
        repoUrl: "https://github.com/Goz1-star/-.git",
        owner: "Goz1-star",
        repo: "-",
        branch: "main",
        baseDir: "",
        syncEnabled: "false",
      }),
    },
    create: {
      section: "github_config",
      valueJson: JSON.stringify({
        repoUrl: "https://github.com/Goz1-star/-.git",
        owner: "Goz1-star",
        repo: "-",
        branch: "main",
        baseDir: "",
        syncEnabled: "false",
      }),
    },
  });

  const admin = await ensureUser({
    name: "室长管理员",
    phone: "18800000001",
    email: "admin@example.com",
    roles: ["admin"],
  });

  const student = await ensureUser({
    name: "普通室员小卒",
    phone: "18800000002",
    email: "student@example.com",
    roles: ["student"],
    studentNo: "STU001",
    points: 86,
  });

  const both = await ensureUser({
    name: "双身份成员",
    phone: "18800000003",
    email: "both@example.com",
    roles: ["admin", "student"],
    studentNo: "STU002",
    points: 128,
  });

  await prisma.announcement.createMany({
    data: [
      {
        title: "欢迎加入无名小卒工坊",
        content: "请各位室员完善个人资料，并按时完成每日打卡。",
        isPinned: true,
        authorId: admin.id,
      },
      {
        title: "本周前端练习任务",
        content: "完成一个响应式登录页，并提交代码文件或 GitHub 链接。",
        authorId: admin.id,
      },
    ],
  });

  const activity = await prisma.activity.create({
    data: {
      title: "React 入门训练营",
      description: "学习组件、状态和基础路由，报名后由管理员审核。",
      startAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
      creatorId: admin.id,
    },
  });

  await prisma.activitySignup.upsert({
    where: { activityId_userId: { activityId: activity.id, userId: student.id } },
    update: { status: "pending" },
    create: { activityId: activity.id, userId: student.id, status: "pending", reason: "想系统学习 React" },
  });

  await prisma.task.create({
    data: {
      title: "完成个人主页 Demo",
      description: "提交 HTML/CSS/JS 文件或 GitHub 仓库链接，代码文件限制 200MB。",
      points: 20,
      creatorId: admin.id,
      submissions: {
        create: {
          userId: student.id,
          content: "已完成基础页面，包含个人介绍和项目展示。",
          githubUrl: "https://github.com/example/workshop-demo",
          githubEnabled: true,
        },
      },
    },
  });

  await prisma.checkin.createMany({
    data: [
      { userId: student.id, type: "duration", durationMin: 90, note: "完成前端练习" },
      { userId: both.id, type: "duration", durationMin: 120, note: "复习 TypeScript", isMakeup: true },
    ],
  });

  await prisma.pointLedger.createMany({
    data: [
      { userId: student.id, points: 20, reason: "任务提交", source: "task" },
      { userId: student.id, points: 10, reason: "时长打卡", source: "checkin" },
      { userId: both.id, points: 30, reason: "管理员奖励", source: "manual" },
    ],
  });

  await prisma.material.createMany({
    data: [
      {
        title: "React 官方文档",
        description: "组件、状态、Hooks 等前端基础学习资料。",
        category: "前端",
        url: "https://react.dev/",
        uploaderId: admin.id,
      },
      {
        title: "GitHub 入门指南",
        description: "学习仓库、分支、提交和 Pull Request 的基本用法。",
        category: "工程化",
        url: "https://docs.github.com/zh/get-started",
        uploaderId: admin.id,
      },
    ],
  });

  const quiz = await prisma.quiz.create({
    data: {
      title: "JavaScript 阶段小测试",
      description: "包含单选、多选、判断和简答。",
      questions: {
        create: [
          { type: "single", title: "React 中用于保存组件状态的 Hook 是？", options: JSON.stringify(["useState", "useMemo", "useRef"]), answer: "useState", points: 5 },
          { type: "multiple", title: "以下哪些属于常见前端技术？", options: JSON.stringify(["HTML", "CSS", "MySQL", "JavaScript"]), answer: "CSS|HTML|JavaScript", points: 5 },
          { type: "truefalse", title: "TypeScript 是 JavaScript 的超集。", answer: "true", points: 5 },
          { type: "short", title: "简单说明 Git 分支的作用。", points: 10 },
        ],
      },
    },
  });

  await prisma.quizAttempt.create({
    data: {
      quizId: quiz.id,
      userId: student.id,
      score: 10,
      status: "submitted",
    },
  });

  console.log("Seed completed");
  console.log("管理员：18800000001 / 123456");
  console.log("学员：18800000002 / 123456");
  console.log("双身份：18800000003 / 123456");
  console.log("模拟验证码：123456");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
