import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManage } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");
  const workspaceId = session.user.workspaceId ?? null;

  const where: Record<string, unknown> = {};
  if (clientId) where.clientId = clientId;
  if (workspaceId) {
    where.client = { OR: [{ workspaceId }, { workspaceId: null }] };
  }

  const projects = await db.project.findMany({
    where,
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, description, clientId, dueDate, visibility, managerId } = body;

  if (!name || !clientId) {
    return NextResponse.json({ error: "name and clientId required" }, { status: 400 });
  }

  const project = await db.project.create({
    data: {
      name,
      description,
      clientId,
      dueDate: dueDate ? new Date(dueDate) : null,
      visibility: visibility ?? "TEAM",
      managerId: managerId ?? session.user.id,
    },
    include: {
      client: { select: { id: true, name: true } },
      _count: { select: { tasks: true } },
    },
  });

  return NextResponse.json(project, { status: 201 });
}
