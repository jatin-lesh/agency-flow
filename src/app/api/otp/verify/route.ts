import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { signToken, SESSION_COOKIE } from "@/lib/session";

export async function POST(req: Request) {
  try {
    const { email, code } = await req.json();
    if (!email || !code) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const otp = await db.oTPCode.findFirst({
      where: {
        email,
        code,
        used: false,
        purpose: "REGISTRATION",
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Invalid or expired code" },
        { status: 400 },
      );
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    await db.oTPCode.update({ where: { id: otp.id }, data: { used: true } });
    await db.user.update({
      where: { id: user.id },
      data: { emailVerified: true },
    });

    // Find user's first workspace if any
    const member = await db.workspaceMember.findFirst({
      where: { userId: user.id },
      orderBy: { createdAt: "asc" },
    });

    const token = await signToken({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      image: user.avatar ?? null,
      workspaceId: member?.workspaceId ?? null,
    });

    const res = NextResponse.json({ ok: true, role: user.role });
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });
    return res;
  } catch (err) {
    console.error("OTP verify error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
