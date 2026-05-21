import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

// PATCH /api/notifications/[id] — mark a single notification as read
export async function PATCH(
  _: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const notif = await db.notification.findUnique({ where: { id } });
  if (!notif || notif.userId !== session.user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const updated = await db.notification.update({
    where: { id },
    data: { read: true },
  });

  return NextResponse.json(updated);
}
