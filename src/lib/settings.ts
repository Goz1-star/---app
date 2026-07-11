import "server-only";

import { db } from "@/lib/db";

export const GITHUB_CONFIG_SECTION = "github_config";

export type GitHubConfig = {
  repoUrl: string;
  owner: string;
  repo: string;
  branch: string;
  baseDir: string;
  syncEnabled: string;
};

export type GitHubSettings = {
  repoUrl: string;
  owner: string;
  repo: string;
  branch: string;
  baseDir: string;
  syncEnabled: boolean;
  tokenConfigured: boolean;
};

export const DEFAULT_GITHUB_CONFIG: GitHubConfig = {
  repoUrl: "https://github.com/Goz1-star/-.git",
  owner: "Goz1-star",
  repo: "-",
  branch: "main",
  baseDir: "",
  syncEnabled: "false",
};

export function parseGitHubRepoUrl(repoUrl: string) {
  const trimmed = repoUrl.trim();
  if (!trimmed) return null;

  const httpsMatch = trimmed.replace(/\.git$/i, "").match(/^https:\/\/github\.com\/([^/]+)\/([^/]+)$/i);
  if (httpsMatch) {
    return { owner: httpsMatch[1], repo: httpsMatch[2] };
  }

  const sshMatch = trimmed.replace(/\.git$/i, "").match(/^git@github\.com:([^/]+)\/([^/]+)$/i);
  if (sshMatch) {
    return { owner: sshMatch[1], repo: sshMatch[2] };
  }

  return null;
}

export function normalizeGitHubConfig(input: Partial<GitHubConfig>): GitHubConfig {
  const repoUrl = String(input.repoUrl ?? DEFAULT_GITHUB_CONFIG.repoUrl).trim() || DEFAULT_GITHUB_CONFIG.repoUrl;
  const parsed = parseGitHubRepoUrl(repoUrl);
  const owner = String(input.owner ?? parsed?.owner ?? DEFAULT_GITHUB_CONFIG.owner).trim() || DEFAULT_GITHUB_CONFIG.owner;
  const repo = String(input.repo ?? parsed?.repo ?? DEFAULT_GITHUB_CONFIG.repo).trim() || DEFAULT_GITHUB_CONFIG.repo;
  const branch = String(input.branch ?? DEFAULT_GITHUB_CONFIG.branch).trim() || DEFAULT_GITHUB_CONFIG.branch;
  const baseDir = String(input.baseDir ?? DEFAULT_GITHUB_CONFIG.baseDir).trim().replace(/^\/+|\/+$/g, "");
  const syncEnabled = input.syncEnabled === "true" || input.syncEnabled === "on" ? "true" : "false";

  return {
    repoUrl,
    owner: parsed?.owner ?? owner,
    repo: parsed?.repo ?? repo,
    branch,
    baseDir,
    syncEnabled,
  };
}

export function parseGitHubConfig(raw?: string | null): GitHubConfig {
  if (!raw) return DEFAULT_GITHUB_CONFIG;
  try {
    return normalizeGitHubConfig({ ...DEFAULT_GITHUB_CONFIG, ...JSON.parse(raw) });
  } catch {
    return DEFAULT_GITHUB_CONFIG;
  }
}

export async function getGitHubSettings(): Promise<GitHubSettings> {
  const setting = await db.systemSetting.findUnique({ where: { section: GITHUB_CONFIG_SECTION } });
  const config = parseGitHubConfig(setting?.valueJson);

  return {
    repoUrl: config.repoUrl,
    owner: config.owner,
    repo: config.repo,
    branch: config.branch,
    baseDir: config.baseDir,
    syncEnabled: config.syncEnabled === "true",
    tokenConfigured: Boolean(process.env.GITHUB_TOKEN),
  };
}
