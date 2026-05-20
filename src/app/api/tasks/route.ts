import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const projectId = searchParams.get("projectId");
  const assigneeId = searchParams.get("assigneeId");

  const tasks = await db.task.findMany({
    where: {
      ...(projectId ? { projectId } : {}),
      ...(assigneeId ? { assigneeId } : {}),
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
      _count: { select: { messages: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(tasks);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { title, description, projectId, assigneeId, dueDate, priority, visibility } = body;

  if (!title || !projectId) {
    return NextResponse.json({ error: "title and projectId required" }, { status: 400 });
  }

  const task = await db.task.create({
    data: {
      title,
      description,
      projectId,
      assigneeId: assigneeId ?? null,
      creatorId: session.user.id,
      dueDate: dueDate ? new Date(dueDate) : null,
      priority: priority ?? "MEDIUM",
      visibility: visibility ?? "TEAM",
    },
    include: {
      assignee: { select: { id: true, name: true, avatar: true } },
      creator: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, client: { select: { id: true, name: true } } } },
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json(task, { status: 201 });
}
