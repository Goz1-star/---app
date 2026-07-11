"use server";

import bcrypt from "bcryptjs";
import type { UploadFile } from "@prisma/client";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { saveUploadFile } from "@/lib/files";
import { syncSubmissionFileToGitHub, type GitHubSyncResult } from "@/lib/github";
import { GITHUB_CONFIG_SECTION, normalizeGitHubConfig } from "@/lib/settings";

function value(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function values(formData: FormData, key: string) {
  return formData.getAll(key).map(String).filter(Boolean);
}

async function syncUserRoles(userId: string, roleKeys: string[]) {
  const normalized = Array.from(new Set(roleKeys.filter((role) => ["admin", "student"].includes(role))));
  if (!normalized.length) throw new Error("至少需要选择一个身份");

  const roles = await db.role.findMany({ where: { key: { in: normalized } } });
  await db.userRole.deleteMany({ where: { userId } });
  await db.userRole.createMany({
    data: roles.map((role) => ({ userId, roleId: role.id })),
  });
}

async function ensureMemberProfile(userId: string, formData: FormData) {
  await db.memberProfile.upsert({
    where: { userId },
    update: {
      studentNo: value(formData, "studentNo") || null,
      grade: value(formData, "grade") || null,
      major: value(formData, "major") || "软件技术",
      bio: value(formData, "bio") || null,
    },
    create: {
      userId,
      studentNo: value(formData, "studentNo") || null,
      grade: value(formData, "grade") || null,
      major: value(formData, "major") || "软件技术",
      bio: value(formData, "bio") || null,
      points: 0,
    },
  });
}

async function applyPointChange(input: { userId: string; points: number; reason: string; source: string }) {
  await db.$transaction([
    db.pointLedger.create({
      data: {
        userId: input.userId,
        points: input.points,
        reason: input.reason,
        source: input.source,
      },
    }),
    db.memberProfile.update({
      where: { userId: input.userId },
      data: { points: { increment: input.points } },
    }),
  ]);
}

function settingPayload(formData: FormData, fields: string[]) {
  return Object.fromEntries(fields.map((field) => [field, value(formData, field)]));
}

function systemSettingPayload(section: string, formData: FormData, fields: string[]) {
  const payload = settingPayload(formData, fields);
  if (section === GITHUB_CONFIG_SECTION) {
    return normalizeGitHubConfig({ ...payload, syncEnabled: formData.get("syncEnabled") === "on" ? "true" : "false" });
  }
  return payload;
}

function githubSyncUpdate(result: GitHubSyncResult) {
  const now = new Date();
  return {
    githubSyncStatus: result.status,
    githubSyncMessage: result.message,
    githubSyncPath: result.path ?? null,
    githubSyncUrl: result.url ?? null,
    githubLastAttemptAt: now,
    githubSyncedAt: result.status === "success" ? now : null,
  };
}

async function saveGitHubSyncResult(submissionId: string, result: GitHubSyncResult) {
  await db.taskSubmission.update({
    where: { id: submissionId },
    data: githubSyncUpdate(result),
  });
}

function optionalDate(raw: string) {
  return raw ? new Date(raw) : null;
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

export async function saveSystemSettingAction(formData: FormData) {
  const session = await requireRole("admin");
  const section = value(formData, "section");
  const fieldsBySection: Record<string, string[]> = {
    basic_info: ["studioName", "studioIntro", "contact"],
    operation_rules: ["activitySignupRule", "reviewRule", "pointsRule"],
    upload_rules: ["supportedFileTypes", "codeFileLimit", "previewRule", "githubRule"],
    [GITHUB_CONFIG_SECTION]: ["repoUrl", "owner", "repo", "branch", "baseDir", "syncEnabled"],
  };
  const fields = fieldsBySection[section] ?? [];
  const payload = systemSettingPayload(section, formData, fields);

  await db.systemSetting.upsert({
    where: { section },
    update: {
      valueJson: JSON.stringify(payload),
      updatedById: session.userId,
    },
    create: {
      section,
      valueJson: JSON.stringify(payload),
      updatedById: session.userId,
    },
  });

  revalidatePath("/admin/settings");
  revalidatePath("/admin");
}

export async function createMemberAction(formData: FormData) {
  await requireRole("admin");
  const phone = value(formData, "phone");
  const password = value(formData, "password") || "123456";
  const roleKeys = values(formData, "roles");
  const passwordHash = await bcrypt.hash(password, 10);

  const user = await db.user.create({
    data: {
      name: value(formData, "name"),
      phone,
      email: value(formData, "email") || null,
      passwordHash,
      status: "active",
    },
  });

  await syncUserRoles(user.id, roleKeys);
  await ensureMemberProfile(user.id, formData);

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/student/rankings");
}

export async function updateMemberAction(formData: FormData) {
  await requireRole("admin");
  const userId = value(formData, "userId");
  const password = value(formData, "password");
  const roleKeys = values(formData, "roles");

  await db.user.update({
    where: { id: userId },
    data: {
      name: value(formData, "name"),
      phone: value(formData, "phone"),
      email: value(formData, "email") || null,
      ...(password ? { passwordHash: await bcrypt.hash(password, 10) } : {}),
    },
  });

  await syncUserRoles(userId, roleKeys);
  await ensureMemberProfile(userId, formData);

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/student/rankings");
}

export async function toggleMemberStatusAction(formData: FormData) {
  await requireRole("admin");
  await db.user.update({
    where: { id: value(formData, "userId") },
    data: { status: value(formData, "status") },
  });
  revalidatePath("/admin/members");
}

export async function adjustMemberPointsAction(formData: FormData) {
  await requireRole("admin");
  const amount = Math.abs(Number(value(formData, "amount") || 0));
  const mode = value(formData, "mode");
  const delta = mode === "deduct" ? -amount : amount;
  const reason = value(formData, "reason");
  if (!amount || !reason) return;

  await db.memberProfile.upsert({
    where: { userId: value(formData, "userId") },
    update: {},
    create: { userId: value(formData, "userId"), major: "软件技术", points: 0 },
  });
  await applyPointChange({
    userId: value(formData, "userId"),
    points: delta,
    reason,
    source: mode === "deduct" ? "manual_deduct" : "manual_reward",
  });

  revalidatePath("/admin");
  revalidatePath("/admin/members");
  revalidatePath("/admin/points");
  revalidatePath("/student");
  revalidatePath("/student/points");
  revalidatePath("/student/rankings");
}

export async function updateAnnouncementAction(formData: FormData) {
  await requireRole("admin");
  await db.announcement.update({
    where: { id: value(formData, "id") },
    data: {
      title: value(formData, "title"),
      content: value(formData, "content"),
      isPinned: formData.get("isPinned") === "on",
    },
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/student/announcements");
}

export async function updateAnnouncementStatusAction(formData: FormData) {
  await requireRole("admin");
  await db.announcement.update({
    where: { id: value(formData, "id") },
    data: { status: value(formData, "status") },
  });
  revalidatePath("/admin/announcements");
  revalidatePath("/student/announcements");
}

export async function updateActivityAction(formData: FormData) {
  await requireRole("admin");
  await db.activity.update({
    where: { id: value(formData, "id") },
    data: {
      title: value(formData, "title"),
      description: value(formData, "description"),
      startAt: new Date(value(formData, "startAt") || Date.now()),
      endAt: optionalDate(value(formData, "endAt")),
      status: value(formData, "status") || "published",
    },
  });
  revalidatePath("/admin/activities");
  revalidatePath("/student/activities");
}

export async function updateTaskAction(formData: FormData) {
  await requireRole("admin");
  await db.task.update({
    where: { id: value(formData, "id") },
    data: {
      title: value(formData, "title"),
      description: value(formData, "description"),
      dueAt: optionalDate(value(formData, "dueAt")),
      points: Number(value(formData, "points") || 0),
      status: value(formData, "status") || "published",
    },
  });
  revalidatePath("/admin/tasks");
  revalidatePath("/student/tasks");
}

async function recalculateQuizAttemptScore(attemptId: string) {
  const answers = await db.quizAnswer.findMany({ where: { attemptId } });
  const score = answers.reduce((sum, answer) => sum + (answer.score ?? 0), 0);
  await db.quizAttempt.update({
    where: { id: attemptId },
    data: { score, status: answers.some((answer) => answer.score === null) ? "partially_graded" : "graded" },
  });
}

export async function gradeQuizAnswerAction(formData: FormData) {
  await requireRole("admin");
  const answerId = value(formData, "answerId");
  const answer = await db.quizAnswer.update({
    where: { id: answerId },
    data: { score: Number(value(formData, "score") || 0) },
  });
  await recalculateQuizAttemptScore(answer.attemptId);
  revalidatePath("/admin/quizzes");
  revalidatePath("/student/quizzes");
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
      endAt: optionalDate(value(formData, "endAt")),
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
  await applyPointChange({ userId: session.userId, points: 5, reason: "完成打卡", source: "checkin" });
  revalidatePath("/student/checkins");
  revalidatePath("/student/rankings");
}

export async function createTaskAction(formData: FormData) {
  const session = await requireRole("admin");
  await db.task.create({
    data: {
      title: value(formData, "title"),
      description: value(formData, "description"),
      dueAt: optionalDate(value(formData, "dueAt")),
      points: Number(value(formData, "points") || 0),
      creatorId: session.userId,
    },
  });
  revalidatePath("/admin/tasks");
  revalidatePath("/student/tasks");
}

export async function submitTaskAction(formData: FormData) {
  const session = await requireRole("student");
  const githubEnabled = formData.get("githubEnabled") === "on";
  const submission = await db.taskSubmission.create({
    data: {
      taskId: value(formData, "taskId"),
      userId: session.userId,
      content: value(formData, "content"),
      githubUrl: value(formData, "githubUrl") || null,
      githubEnabled,
      githubSyncStatus: githubEnabled ? "pending" : "not_requested",
    },
    include: { task: true, user: true },
  });

  const uploadedFiles: UploadFile[] = [];
  const files = formData.getAll("files");
  for (const file of files) {
    if (file instanceof File) {
      const upload = await saveUploadFile({ file, bucket: "submissions", ownerId: submission.id, submissionId: submission.id });
      if (upload) uploadedFiles.push(upload);
    }
  }

  if (githubEnabled) {
    const codeFile = uploadedFiles.find((file) => file.category === "code" || file.previewable);
    if (!uploadedFiles.length) {
      await saveGitHubSyncResult(submission.id, { status: "skipped", message: "未上传代码文件" });
    } else if (!codeFile) {
      await saveGitHubSyncResult(submission.id, { status: "skipped", message: "仅代码文件支持自动写入 GitHub" });
    } else {
      const result = await syncSubmissionFileToGitHub({
        submissionId: submission.id,
        taskTitle: submission.task.title,
        studentName: submission.user.name,
        fileName: codeFile.originalName,
        storagePath: codeFile.storagePath,
      });
      await saveGitHubSyncResult(submission.id, result);
    }
  }

  revalidatePath("/student/tasks");
  revalidatePath("/admin/tasks");
}

export async function retrySubmissionGitHubSyncAction(formData: FormData) {
  await requireRole("admin");
  const submission = await db.taskSubmission.findUnique({
    where: { id: value(formData, "id") },
    include: { task: true, user: true, files: true },
  });
  if (!submission) return;

  const codeFile = submission.files.find((file) => file.category === "code" || file.previewable);
  if (!codeFile) {
    await saveGitHubSyncResult(submission.id, { status: "skipped", message: "没有可同步的代码文件" });
    revalidatePath("/admin/tasks");
    revalidatePath("/student/tasks");
    return;
  }

  await db.taskSubmission.update({
    where: { id: submission.id },
    data: { githubSyncStatus: "pending", githubSyncMessage: "正在重新同步 GitHub", githubLastAttemptAt: new Date() },
  });

  const result = await syncSubmissionFileToGitHub({
    submissionId: submission.id,
    taskTitle: submission.task.title,
    studentName: submission.user.name,
    fileName: codeFile.originalName,
    storagePath: codeFile.storagePath,
  });
  await saveGitHubSyncResult(submission.id, result);

  revalidatePath("/admin/tasks");
  revalidatePath("/student/tasks");
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
