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

  const projects = await db.project.findMany({
    where: { clientId: access.clientId, visibility: "CLIENT" },
    include: { _count: { select: { tasks: true } } },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(projects);
}
