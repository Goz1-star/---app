import ExcelJS from "exceljs";
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  await requireRole("admin");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "无名小卒工坊";

  const membersSheet = workbook.addWorksheet("成员名单");
  membersSheet.columns = [
    { header: "姓名", key: "name", width: 18 },
    { header: "手机号", key: "phone", width: 18 },
    { header: "学号", key: "studentNo", width: 16 },
    { header: "专业", key: "major", width: 18 },
    { header: "积分", key: "points", width: 12 },
  ];
  const members = await db.memberProfile.findMany({ include: { user: true } });
  members.forEach((item) => membersSheet.addRow({ name: item.user.name, phone: item.user.phone, studentNo: item.studentNo, major: item.major, points: item.points }));

  const checkinSheet = workbook.addWorksheet("打卡记录");
  checkinSheet.columns = [
    { header: "姓名", key: "name", width: 18 },
    { header: "类型", key: "type", width: 12 },
    { header: "时长", key: "duration", width: 12 },
    { header: "补卡", key: "makeup", width: 12 },
    { header: "原因", key: "reason", width: 24 },
    { header: "时间", key: "time", width: 24 },
  ];
  const checkins = await db.checkin.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } });
  checkins.forEach((item) => checkinSheet.addRow({ name: item.user.name, type: item.type, duration: item.durationMin ?? "", makeup: item.isMakeup ? "是" : "否", reason: item.makeupReason ?? "", time: item.createdAt.toISOString() }));

  const signupSheet = workbook.addWorksheet("报名审核");
  signupSheet.columns = [
    { header: "活动", key: "activity", width: 24 },
    { header: "姓名", key: "name", width: 18 },
    { header: "状态", key: "status", width: 12 },
    { header: "说明", key: "reason", width: 24 },
  ];
  const signups = await db.activitySignup.findMany({ include: { activity: true, user: true } });
  signups.forEach((item) => signupSheet.addRow({ activity: item.activity.title, name: item.user.name, status: item.status, reason: item.reason ?? "" }));

  const submissionSheet = workbook.addWorksheet("任务提交");
  submissionSheet.columns = [
    { header: "任务", key: "task", width: 24 },
    { header: "姓名", key: "name", width: 18 },
    { header: "GitHub", key: "github", width: 40 },
    { header: "状态", key: "status", width: 12 },
    { header: "分数", key: "score", width: 12 },
  ];
  const submissions = await db.taskSubmission.findMany({ include: { task: true, user: true } });
  submissions.forEach((item) => submissionSheet.addRow({ task: item.task.title, name: item.user.name, github: item.githubUrl ?? "", status: item.status, score: item.score ?? "" }));

  const quizSheet = workbook.addWorksheet("小测试成绩");
  quizSheet.columns = [
    { header: "测试", key: "quiz", width: 24 },
    { header: "姓名", key: "name", width: 18 },
    { header: "得分", key: "score", width: 12 },
    { header: "状态", key: "status", width: 14 },
    { header: "提交时间", key: "time", width: 24 },
  ];
  const quizAttempts = await db.quizAttempt.findMany({ include: { quiz: true, user: true }, orderBy: { createdAt: "desc" } });
  quizAttempts.forEach((item) => quizSheet.addRow({ quiz: item.quiz.title, name: item.user.name, score: item.score ?? "", status: item.status, time: item.createdAt.toISOString() }));

  const pointsSheet = workbook.addWorksheet("积分明细");
  pointsSheet.columns = [
    { header: "姓名", key: "name", width: 18 },
    { header: "手机号", key: "phone", width: 18 },
    { header: "积分变化", key: "points", width: 12 },
    { header: "原因", key: "reason", width: 32 },
    { header: "来源", key: "source", width: 16 },
    { header: "时间", key: "time", width: 24 },
  ];
  const pointLedgers = await db.pointLedger.findMany({ include: { user: true }, orderBy: { createdAt: "desc" } });
  pointLedgers.forEach((item) => pointsSheet.addRow({ name: item.user.name, phone: item.user.phone, points: item.points, reason: item.reason, source: item.source, time: item.createdAt.toISOString() }));

  const buffer = await workbook.xlsx.writeBuffer();
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="workshop-export.xlsx"`,
    },
  });
}
