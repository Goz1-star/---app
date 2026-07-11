import "server-only";

import { readFile } from "node:fs/promises";
import { getGitHubSettings, type GitHubSettings } from "@/lib/settings";

export type GitHubSyncStatus = "success" | "failed" | "skipped";

export type GitHubSyncResult = {
  status: GitHubSyncStatus;
  message: string;
  path?: string;
  url?: string;
};

type SyncSubmissionFileInput = {
  submissionId: string;
  taskTitle: string;
  studentName: string;
  fileName: string;
  storagePath: string;
};

type GitHubContentResponse = {
  sha?: string;
  html_url?: string;
  content?: { html_url?: string };
  message?: string;
  documentation_url?: string;
};

function cleanMessage(message: string) {
  return message.replace(/\s+/g, " ").trim().slice(0, 500);
}

function safePathSegment(value: string, fallback: string) {
  const safe = value
    .trim()
    .replace(/\.\./g, "")
    .replace(/[^a-zA-Z0-9._\-一-龥]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
  return safe || fallback;
}

function normalizeBaseDir(baseDir: string) {
  return baseDir
    .split("/")
    .map((item) => safePathSegment(item, ""))
    .filter(Boolean)
    .join("/");
}

function encodeGitHubPath(filePath: string) {
  return filePath.split("/").map(encodeURIComponent).join("/");
}

function buildBlobUrl(settings: GitHubSettings, filePath: string) {
  return `https://github.com/${settings.owner}/${settings.repo}/blob/${encodeURIComponent(settings.branch)}/${encodeGitHubPath(filePath)}`;
}

export function buildSubmissionGitHubPath(input: SyncSubmissionFileInput, settings: GitHubSettings) {
  const prefix = normalizeBaseDir(settings.baseDir);
  const parts = [
    prefix,
    "submissions",
    safePathSegment(input.taskTitle, "task"),
    safePathSegment(input.studentName, "student"),
    safePathSegment(input.submissionId, "submission"),
    safePathSegment(input.fileName, "file"),
  ].filter(Boolean);

  return parts.join("/");
}

async function getExistingFileSha(settings: GitHubSettings, filePath: string, token: string) {
  const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${encodeGitHubPath(filePath)}?ref=${encodeURIComponent(settings.branch)}`;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (response.status === 404) return undefined;
  const data = (await response.json().catch(() => ({}))) as GitHubContentResponse;
  if (!response.ok) {
    throw new Error(`读取 GitHub 文件状态失败：${response.status} ${data.message ?? response.statusText}`);
  }
  return data.sha;
}

export async function syncSubmissionFileToGitHub(input: SyncSubmissionFileInput): Promise<GitHubSyncResult> {
  const settings = await getGitHubSettings();
  const token = process.env.GITHUB_TOKEN;

  if (!settings.syncEnabled) {
    return { status: "skipped", message: "系统未启用 GitHub 写入" };
  }
  if (!token) {
    return { status: "failed", message: "GitHub Token 未配置" };
  }
  if (!settings.owner || !settings.repo || !settings.branch) {
    return { status: "failed", message: "GitHub 仓库配置不完整" };
  }

  const filePath = buildSubmissionGitHubPath(input, settings);

  try {
    const content = await readFile(input.storagePath);
    const sha = await getExistingFileSha(settings, filePath, token);
    const url = `https://api.github.com/repos/${settings.owner}/${settings.repo}/contents/${encodeGitHubPath(filePath)}`;
    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        message: `Sync task submission ${input.submissionId}`,
        content: content.toString("base64"),
        branch: settings.branch,
        ...(sha ? { sha } : {}),
      }),
    });
    const data = (await response.json().catch(() => ({}))) as GitHubContentResponse;

    if (!response.ok) {
      return {
        status: "failed",
        message: cleanMessage(`GitHub 写入失败：${response.status} ${data.message ?? response.statusText}`),
        path: filePath,
      };
    }

    return {
      status: "success",
      message: sha ? "已更新 GitHub 文件" : "已写入 GitHub 文件",
      path: filePath,
      url: data.content?.html_url ?? data.html_url ?? buildBlobUrl(settings, filePath),
    };
  } catch (error) {
    return {
      status: "failed",
      message: cleanMessage(error instanceof Error ? error.message : "GitHub 写入失败"),
      path: filePath,
    };
  }
}
