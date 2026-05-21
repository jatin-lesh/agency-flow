import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signToken, SESSION_COOKIE } from "@/lib/session";
import type { Role, WorkspaceRole } from "@prisma/client";

export async function POST(req: Request, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const inv = await db.workspaceInvitation.findUnique({ where: { token } });
    if (!inv) return NextResponse.json({ error: "Invitation not found" }, { status: 404 });
    if (inv.acceptedAt) return NextResponse.json({ error: "Already accepted" }, { status: 410 });
    if (inv.expiresAt < new Date()) return NextResponse.json({ error: "Expired" }, { status: 410 });

    const body = await req.json();
    const { name, password, clientId } = body as {
      name?: string;
      password?: string;
      clientId?: string;
    };

    let user = await db.user.findUnique({ where: { email: inv.email } });
    if (!user) {
      if (!name || !password || password.length < 8) {
        return NextResponse.json(
          { error: "Name and password (8+ chars) required for new accounts" },
          { status: 400 },
        );
      }
      const hashed = await bcrypt.hash(password, 12);
      const userRole: Role =
        inv.role === "CLIENT" ? "CLIENT_USER" : "MEMBER";
      user = await db.user.create({
        data: {
          name,
          email: inv.email,
          password: hashed,
          role: userRole,
          emailVerified: true,
        },
      });
    }

    // Idempotent membership
    await db.workspaceMember.upsert({
      where: { workspaceId_userId: { workspaceId: inv.workspaceId, userId: user.id } },
      update: {},
      create: {
        workspaceId: inv.workspaceId,
        userId: user.id,
        role: (inv.role as WorkspaceRole) ?? "MEMBER",
      },
    });

    // If this is a client invitation and a clientId was passed, create portal access
    if (inv.role === "CLIENT" && clientId) {
      await db.clientPortalAccess.upsert({
        where: { userId: user.id },
        update: { clientId },
        create: { userId: user.id, clientId },
      });
    }

    await db.workspaceInvitation.update({
      where: { id: inv.id },
      data: { acceptedAt: new Date() },
    });

    const token2 = await signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.avatar ?? null,
      workspaceId: inv.workspaceId,
    });

    const res = NextResponse.json({ ok: true, role: user.role });
    res.cookies.set(SESSION_COOKIE, token2, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (err) {
    console.error("Accept invitation error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
