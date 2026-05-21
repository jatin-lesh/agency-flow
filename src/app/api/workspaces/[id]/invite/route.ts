import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendInvitation } from "@/lib/email";
import type { WorkspaceRole } from "@prisma/client";

const appUrl =
  process.env.NEXT_PUBLIC_APP_URL ??
  process.env.APP_URL ??
  "http://localhost:3000";

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: workspaceId } = await params;
  const member = await db.workspaceMember.findUnique({
    where: { workspaceId_userId: { workspaceId, userId: session.user.id } },
  });
  if (!member || (member.role !== "OWNER" && member.role !== "ADMIN")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { email, role, clientId } = await req.json();
  if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

  const ws = await db.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) return NextResponse.json({ error: "Workspace not found" }, { status: 404 });

  const token = crypto.randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

  await db.workspaceInvitation.create({
    data: {
      workspaceId,
      email,
      role: (role as WorkspaceRole) ?? "MEMBER",
      token,
      expiresAt,
      invitedById: session.user.id,
    },
  });

  // Build the full invite link (clientId embedded as query param for portal invites)
  const inviteLink = clientId
    ? `${appUrl}/invitations/${token}?client=${clientId}`
    : `${appUrl}/invitations/${token}`;

  // Try to send email — may fail if no custom domain is verified in Resend
  let emailSent = false;
  try {
    const result = await sendInvitation(
      email,
      clientId ? `${token}?client=${clientId}` : token,
      ws.name,
      session.user.name,
    );
    emailSent = !("skipped" in result) && !("error" in result);
  } catch {
    emailSent = false;
  }

  return NextResponse.json({ ok: true, inviteLink, emailSent });
}
