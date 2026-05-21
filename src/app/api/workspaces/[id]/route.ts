import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function isWorkspaceAdmin(userId: string, workspaceId: string) {
  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId } },
  });
  if (!member) return false;
  return member.role === "OWNER" || member.role === "ADMIN";
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  if (!(await isWorkspaceAdmin(session.user.id, id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const data: { name?: string } = {};
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();

  const ws = await db.workspace.update({ where: { id }, data });
  return NextResponse.json(ws);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const ws = await db.workspace.findUnique({ where: { id } });
  if (!ws) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (ws.ownerId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db.workspace.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
