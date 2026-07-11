import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { db } from "@/lib/db";

const CODE_FILE_PATTERN = /\.(html|css|js|jsx|ts|tsx|vue|java|py|cpp|c|cs|go|rs|php|rb|md|json|xml|sql)$/i;
const CODE_FILE_LIMIT = 200 * 1024 * 1024;

export function isCodeFile(fileName: string) {
  return CODE_FILE_PATTERN.test(fileName);
}

export function safeFileName(fileName: string) {
  return fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export function formatFileSize(size: number) {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(1)} MB`;
}

export async function saveUploadFile(input: {
  file: File;
  bucket: "submissions" | "materials";
  ownerId: string;
  submissionId?: string;
  materialId?: string;
}) {
  const { file, bucket, ownerId, submissionId, materialId } = input;
  if (!file || file.size === 0) return null;

  const codeFile = isCodeFile(file.name);
  if (codeFile && file.size > CODE_FILE_LIMIT) {
    throw new Error("代码文件不能超过 200MB");
  }

  const uploadRoot = process.env.UPLOAD_DIR ?? "./uploads";
  const dir = path.join(process.cwd(), uploadRoot, bucket, ownerId);
  await mkdir(dir, { recursive: true });
  const fileName = `${Date.now()}-${safeFileName(file.name)}`;
  const storagePath = path.join(dir, fileName);
  const bytes = Buffer.from(await file.arrayBuffer());
  await writeFile(storagePath, bytes);

  return db.uploadFile.create({
    data: {
      originalName: file.name,
      storagePath,
      mimeType: file.type || null,
      size: file.size,
      category: codeFile ? "code" : bucket === "materials" ? "material" : "file",
      previewable: codeFile,
      submissionId,
      materialId,
    },
  });
}

export async function readPreview(storagePath: string, limit = 12000) {
  const text = await readFile(storagePath, "utf8");
  return text.slice(0, limit);
}
