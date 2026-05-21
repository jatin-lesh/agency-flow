import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/utils";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const users = await db.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
      createdAt: true,
      _count: { select: { assignedTasks: true } },
    },
    orderBy: { name: "asc" },
  });

  return NextResponse.json(users);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId, role } = await req.json();
  if (!userId || !role) return NextResponse.json({ error: "userId and role required" }, { status: 400 });

  const updated = await db.user.update({
    where: { id: userId },
    data: { role },
    select: { id: true, name: true, email: true, role: true },
  });

  return NextResponse.json(updated);
}

export async function DELETE(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { userId } = await req.json();
  if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
  if (userId === session.user.id) {
    return NextResponse.json({ error: "Use your profile page to delete your own account" }, { status: 400 });
  }

  await deleteUserAccount(userId);
  return NextResponse.json({ ok: true });
}

async function deleteUserAccount(userId: string) {
  // Unassign tasks so they aren't orphaned visually
  await db.task.updateMany({ where: { assigneeId: userId }, data: { assigneeId: null } });

  // Transfer or remove owned workspaces
  const ownedWorkspaces = await db.workspace.findMany({
    where: { ownerId: userId },
    include: {
      members: {
        where: { userId: { not: userId } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  for (const ws of ownedWorkspaces) {
    const next =
      ws.members.find((m) => m.role === "ADMIN" || m.role === "OWNER") ??
      ws.members[0];
    if (next) {
      await db.workspace.update({ where: { id: ws.id }, data: { ownerId: next.userId } });
      await db.workspaceMember.update({ where: { id: next.id }, data: { role: "OWNER" } });
    } else {
      // Sole owner — delete the whole workspace (cascades clients/projects/tasks)
      await db.workspace.delete({ where: { id: ws.id } });
    }
  }

  // Delete user — schema cascades handle: accounts, sessions, memberships,
  // portal access, notifications. creatorId/userId on tasks/messages become null (SetNull).
  await db.user.delete({ where: { id: userId } });
}

export { deleteUserAccount };
