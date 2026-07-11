import { readFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { getCurrentSession } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_request: Request, { params }: { params: Promise<{ fileId: string }> }) {
  const { fileId } = await params;
  const file = await db.uploadFile.findUnique({
    where: { id: fileId },
    include: { submission: true, material: true },
  });

  if (!file) return new NextResponse("File not found", { status: 404 });

  const session = await getCurrentSession();
  const canAccessSubmissionFile = Boolean(
    file.submissionId && session && (session.activeRole === "admin" || (session.activeRole === "student" && file.submission?.userId === session.userId)),
  );
  const canAccessMaterialFile = Boolean(file.materialId && session && ["admin", "student"].includes(session.activeRole));

  if (!canAccessSubmissionFile && !canAccessMaterialFile) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  const bytes = await readFile(file.storagePath);
  return new NextResponse(bytes, {
    headers: {
      "Content-Type": file.mimeType || "application/octet-stream",
      "Content-Disposition": `attachment; filename*=UTF-8''${encodeURIComponent(file.originalName)}`,
    },
  });
}
