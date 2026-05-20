import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [totalClients, totalProjects, totalTasks, myTasks, recentTasks] = await Promise.all([
    db.client.count(),
    db.project.count(),
    db.task.count(),
    db.task.count({ where: { assigneeId: session.user.id, status: { not: "DONE" } } }),
    db.task.findMany({
      where:
        session.user.role === "MEMBER"
          ? { OR: [{ assigneeId: session.user.id }, { creatorId: session.user.id }] }
          : {},
      include: {
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true, client: { select: { name: true } } } },
      },
      orderBy: { updatedAt: "desc" },
      take: 8,
    }),
  ]);

  const tasksByStatus = await db.task.groupBy({
    by: ["status"],
    _count: true,
  });

  return NextResponse.json({
    stats: { totalClients, totalProjects, totalTasks, myTasks },
    recentTasks,
    tasksByStatus,
  });
}
