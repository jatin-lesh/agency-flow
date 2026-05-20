import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManage } from "@/lib/utils";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { content } = await req.json();

  const msg = await db.threadMessage.findUnique({ where: { id } });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.userId !== session.user.id && !canManage(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.threadMessage.update({
    where: { id },
    data: { content, isEdited: true },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
      attachments: true,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const msg = await db.threadMessage.findUnique({ where: { id } });
  if (!msg) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (msg.userId !== session.user.id && !canManage(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.threadMessage.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
