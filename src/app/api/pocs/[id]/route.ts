import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManage } from "@/lib/utils";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json();

  if (body.isPrimary) {
    const existing = await db.pOC.findUnique({ where: { id } });
    if (existing) {
      await db.pOC.updateMany({
        where: { clientId: existing.clientId },
        data: { isPrimary: false },
      });
    }
  }

  const poc = await db.pOC.update({ where: { id }, data: body });
  return NextResponse.json(poc);
}

export async function DELETE(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;
  await db.pOC.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
