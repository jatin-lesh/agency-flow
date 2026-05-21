import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManage } from "@/lib/utils";
import { notifyTaskEvent } from "@/lib/notifications";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await db.task.findUnique({
    where: { id },
    include: {
      assignee: { select: { id: true, name: true, avatar: true, email: true } },
      creator: { select: { id: true, name: true, avatar: true } },
      project: {
        select: {
          id: true,
          name: true,
          client: { select: { id: true, name: true } },
        },
      },
      messages: {
        include: {
          user: { select: { id: true, name: true, avatar: true, role: true } },
          attachments: true,
        },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(task);
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json();

  const task = await db.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner =
    task.creatorId === session.user.id || task.assigneeId === session.user.id;
  if (!isOwner && !canManage(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await db.task.update({
    where: { id },
    data: {
      ...body,
      dueDate: body.dueDate ? new Date(body.dueDate) : undefined,
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
    },
  });

  notifyTaskEvent("task.updated", { id: updated.id, title: updated.title }, session.user.name, db);

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const task = await db.task.findUnique({ where: { id } });
  if (!task) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (task.creatorId !== session.user.id && !canManage(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.task.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
