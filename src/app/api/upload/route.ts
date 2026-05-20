import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { uploadFile } from "@/lib/cloudinary";
import { AttachmentType } from "@prisma/client";

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const file = formData.get("file") as File | null;
  const messageId = formData.get("messageId") as string | null;

  if (!file || !messageId) {
    return NextResponse.json({ error: "file and messageId required" }, { status: 400 });
  }

  const MAX_SIZE = 100 * 1024 * 1024; // 100 MB
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "File too large (max 100 MB)" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const { url, publicId, type } = await uploadFile(buffer, file.name);

  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  let attachmentType: AttachmentType = "OTHER";
  if (["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(ext)) attachmentType = "IMAGE";
  else if (["mp4", "mov", "avi", "webm"].includes(ext)) attachmentType = "VIDEO";
  else if (["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "txt"].includes(ext))
    attachmentType = "DOCUMENT";

  const attachment = await db.attachment.create({
    data: {
      name: file.name,
      url,
      publicId,
      type: attachmentType,
      size: file.size,
      messageId,
    },
  });

  return NextResponse.json({ ...attachment, cloudType: type }, { status: 201 });
}
