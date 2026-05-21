import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const access = await db.clientPortalAccess.findUnique({
    where: { userId: session.user.id },
  });
  if (!access) return NextResponse.json([], { status: 200 });

  const tasks = await db.task.findMany({
    where: {
      visibility: "CLIENT",
      project: { clientId: access.clientId, visibility: "CLIENT" },
    },
    include: {
      project: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true, avatar: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(tasks);
}
