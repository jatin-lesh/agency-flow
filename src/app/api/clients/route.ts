import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManage } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const workspaceId = session.user.workspaceId ?? null;

  const clients = await db.client.findMany({
    where: workspaceId
      ? { OR: [{ workspaceId }, { workspaceId: null }] }
      : undefined,
    include: { pocs: true, _count: { select: { projects: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(clients);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, industry, website, notes, visibility } = body;

  if (!name) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const workspaceId = session.user.workspaceId ?? null;

  const client = await db.client.create({
    data: {
      name,
      industry,
      website,
      notes,
      visibility: visibility ?? "TEAM",
      workspaceId,
    },
  });

  return NextResponse.json(client, { status: 201 });
}
