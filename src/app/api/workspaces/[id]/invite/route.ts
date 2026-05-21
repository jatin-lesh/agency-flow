import { NextResponse } from "next/server";
import crypto from "crypto";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendInvitation } from "@/lib/email";
import type { WorkspaceRole } from "@prisma/client";

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

  const invitation = await db.workspaceInvitation.create({
    data: {
      workspaceId,
      email,
      role: (role as WorkspaceRole) ?? "MEMBER",
      token,
      expiresAt,
      invitedById: session.user.id,
    },
  });

  // If a clientId is given, mark intent — we'll create ClientPortalAccess at acceptance time
  // Persisted as a note column would be ideal, but for now we look it up via metadata heuristic:
  // we encode it in the invitation's email+role+workspaceId scope. To keep it explicit, store
  // a quick mapping by attaching ClientPortalAccess on accept based on `clientId` looked up from
  // an out-of-band table — simplest approach: stash in a global map via the invitation token.
  // Here, we forward the clientId via the email link by adding a query param.
  await sendInvitation(email, token + (clientId ? `?client=${clientId}` : ""), ws.name, session.user.name);

  return NextResponse.json({ ok: true, id: invitation.id });
}
