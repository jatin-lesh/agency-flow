import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(_: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const inv = await db.workspaceInvitation.findUnique({
    where: { token },
    include: { workspace: { select: { id: true, name: true } } },
  });
  if (!inv) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
  if (inv.acceptedAt) {
    return NextResponse.json({ error: "Already accepted" }, { status: 410 });
  }
  if (inv.expiresAt < new Date()) {
    return NextResponse.json({ error: "Expired" }, { status: 410 });
  }
  return NextResponse.json({
    email: inv.email,
    role: inv.role,
    workspace: inv.workspace,
  });
}
