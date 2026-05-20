import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const messages = await db.threadMessage.findMany({
    where: { taskId },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
      attachments: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(messages);
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: taskId } = await params;
  const { content } = await req.json();

  if (!content?.trim()) {
    return NextResponse.json({ error: "Content required" }, { status: 400 });
  }

  const message = await db.threadMessage.create({
    data: { content: content.trim(), taskId, userId: session.user.id },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
      attachments: true,
    },
  });

  return NextResponse.json(message, { status: 201 });
}
