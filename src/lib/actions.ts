"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { saveUploadFile } from "@/lib/files";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseOptions(raw: string) {
  return raw
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function normalizeAnswer(type: string, raw: string) {
  if (type === "multiple") {
    return raw
      .split(/[,，\n]/)
      .map((item) => item.trim())
      .filter(Boolean)
      .sort()
      .join("|");
  }
  return raw.trim();
}

function isAnswerCorrect(type: string, expected: string | null, actual: string) {
  if (!expected) return false;
  return normalizeAnswer(type, expected) === normalizeAnswer(type, actual);
}

export async function createMaterialAction(formData: FormData) {
  const session = await requireRole("admin");
  const material = await db.material.create({
    data: {
      title: value(formData, "title"),
      description: value(formData, "description") || null,
      category: value(formData, "category") || "未分类",
      url: value(formData, "url") || null,
      uploaderId: session.userId,
    },
  });

  const files = formData.getAll("files");
  for (const file of files) {
    if (file instanceof File) {
      await saveUploadFile({ file, bucket: "materials", ownerId: material.id, materialId: material.id });
    }
  }

  revalidatePath("/admin/materials");
  revalidatePath("/student/materials");
}

export async function createQuizAction(formData: FormData) {
  await requireRole("admin");
  await db.quiz.create({
    data: {
      title: value(formData, "title"),
      description: value(formData, "description") || null,
    },
  });
  revalidatePath("/admin/quizzes");
  revalidatePath("/student/quizzes");
}

export async function createQuizQuestionAction(formData: FormData) {
  await requireRole("admin");
  const type = value(formData, "type");
  const options = parseOptions(value(formData, "options"));
  await db.quizQuestion.create({
    data: {
      quizId: value(formData, "quizId"),
      type,
      title: value(formData, "title"),
      options: options.length ? JSON.stringify(options) : null,
      answer: value(formData, "answer") || null,
      points: Number(value(formData, "points") || 1),
    },
  });
  revalidatePath("/admin/quizzes");
  revalidatePath(`/student/quizzes/${value(formData, "quizId")}`);
}

export async function submitQuizAttemptAction(formData: FormData) {
  const session = await requireRole("student");
  const quizId = value(formData, "quizId");
  const questions = await db.quizQuestion.findMany({ where: { quizId } });

  let score = 0;
  const answers = questions.map((question) => {
    const key = `question_${question.id}`;
    const answer = question.type === "multiple" ? formData.getAll(key).map(String).join("|") : value(formData, key);
    const autoGradable = question.type !== "short";
    const earned = autoGradable && isAnswerCorrect(question.type, question.answer, answer) ? question.points : 0;
    score += earned;
    return {
      questionId: question.id,
      answer,
      score: autoGradable ? earned : null,
    };
  });

  await db.quizAttempt.create({
    data: {
      quizId,
      userId: session.userId,
      score,
      status: "submitted",
      answers: { create: answers },
    },
  });

  revalidatePath("/student/quizzes");
  revalidatePath(`/student/quizzes/${quizId}`);
  revalidatePath("/admin/quizzes");
  redirect("/student/quizzes");
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

  const files = formData.getAll("files");
  for (const file of files) {
    if (file instanceof File) {
      await saveUploadFile({ file, bucket: "submissions", ownerId: submission.id, submissionId: submission.id });
    }
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
