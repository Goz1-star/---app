"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function isCodeFile(fileName: string) {
  return /\.(html|css|js|jsx|ts|tsx|vue|java|py|cpp|c|cs|go|rs|php|rb|md|json|xml|sql)$/i.test(fileName);
}

function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

async function saveSubmissionFile(file: File, submissionId: string) {
  if (!file || file.size === 0) return;
  const codeFile = isCodeFile(file.name);
  const codeLimit = 200 * 1024 * 1024;
  if (codeFile && file.size > codeLimit) {
    throw new Error("代码文件不能超过 200MB");
  }

  const uploadRoot = process.env.UPLOAD_DIR ?? "./uploads";
  const dir = path.join(process.cwd(), uploadRoot, submissionId);
  await mkdir(dir, { recursive: true });
  const fileName = `${Date.now()}-${safeFileName(file.name)}`;
  const storagePath = path.join(dir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, bytes);

  await db.uploadFile.create({
    data: {
      originalName: file.name,
      storagePath,
      mimeType: file.type || null,
      size: file.size,
      category: codeFile ? "code" : "file",
      previewable: codeFile,
      submissionId,
    },
  });
}

export async function createAnnouncementAction(formData: FormData) {
  const session = await requireRole("admin");
  await db.announcement.create({
    data: {
      title: value(formData, "title"),
      content: value(formData, "content"),
      isPinned: formData.get("isPinned") === "on",
      authorId: session.userId,
    },
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/student/announcements");
}

export async function createActivityAction(formData: FormData) {
  const session = await requireRole("admin");
  await db.activity.create({
    data: {
      title: value(formData, "title"),
      description: value(formData, "description"),
      startAt: new Date(value(formData, "startAt") || Date.now()),
      creatorId: session.userId,
    },
  });
  revalidatePath("/admin/activities");
  revalidatePath("/student/activities");
}

export async function reviewSignupAction(formData: FormData) {
  await requireRole("admin");
  const id = value(formData, "id");
  const status = value(formData, "status");
  await db.activitySignup.update({
    where: { id },
    data: { status, reviewedAt: new Date() },
  });
  revalidatePath("/admin/activities");
}

export async function signupActivityAction(formData: FormData) {
  const session = await requireRole("student");
  const activityId = value(formData, "activityId");
  await db.activitySignup.upsert({
    where: { activityId_userId: { activityId, userId: session.userId } },
    update: { status: "pending", reason: value(formData, "reason") },
    create: { activityId, userId: session.userId, status: "pending", reason: value(formData, "reason") },
  });
  revalidatePath("/student/activities");
  revalidatePath("/admin/activities");
}

export async function createCheckinAction(formData: FormData) {
  const session = await requireRole("student");
  const type = value(formData, "type");
  const duration = value(formData, "durationMin");
  await db.checkin.create({
    data: {
      userId: session.userId,
      type,
      durationMin: duration ? Number(duration) : null,
      note: value(formData, "note"),
      isMakeup: formData.get("isMakeup") === "on",
      makeupReason: value(formData, "makeupReason") || null,
    },
  });
  await db.pointLedger.create({
    data: { userId: session.userId, points: 5, reason: "完成打卡", source: "checkin" },
  });
  await db.memberProfile.updateMany({ where: { userId: session.userId }, data: { points: { increment: 5 } } });
  revalidatePath("/student/checkins");
  revalidatePath("/student/rankings");
}

export async function createTaskAction(formData: FormData) {
  const session = await requireRole("admin");
  await db.task.create({
    data: {
      title: value(formData, "title"),
      description: value(formData, "description"),
      points: Number(value(formData, "points") || 0),
      creatorId: session.userId,
    },
  });
  revalidatePath("/admin/tasks");
  revalidatePath("/student/tasks");
}

export async function submitTaskAction(formData: FormData) {
  const session = await requireRole("student");
  const submission = await db.taskSubmission.create({
    data: {
      taskId: value(formData, "taskId"),
      userId: session.userId,
      content: value(formData, "content"),
      githubUrl: value(formData, "githubUrl") || null,
      githubEnabled: formData.get("githubEnabled") === "on",
    },
  });

  const file = formData.get("file");
  if (file instanceof File) {
    await saveSubmissionFile(file, submission.id);
  }

  revalidatePath("/student/tasks");
  revalidatePath("/admin/tasks");
}

export async function reviewSubmissionAction(formData: FormData) {
  await requireRole("admin");
  await db.taskSubmission.update({
    where: { id: value(formData, "id") },
    data: {
      score: Number(value(formData, "score") || 0),
      feedback: value(formData, "feedback"),
      status: "reviewed",
    },
  });
  revalidatePath("/admin/tasks");
}
