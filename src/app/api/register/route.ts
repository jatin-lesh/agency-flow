import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { sendOTP } from "@/lib/email";

function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { name, email, password } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "Email already registered" },
        { status: 409 },
      );
    }

    // First user becomes admin
    const count = await db.user.count();
    const hashed = await bcrypt.hash(password, 12);
    const role = count === 0 ? "ADMIN" : "MEMBER";

    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashed,
        role,
        emailVerified: false,
      },
    });

    // First admin user automatically gets a default "Lesh Space" workspace
    if (role === "ADMIN") {
      const ws = await db.workspace.create({
        data: {
          name: "Lesh Space",
          ownerId: user.id,
        },
      });
      await db.workspaceMember.create({
        data: { workspaceId: ws.id, userId: user.id, role: "OWNER" },
      });
    }

    // Create + send OTP
    const code = genCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.oTPCode.create({
      data: { email, code, purpose: "REGISTRATION", expiresAt },
    });
    await sendOTP(email, code, "REGISTRATION");

    return NextResponse.json(
      {
        id: user.id,
        email: user.email,
        requiresVerification: true,
      },
      { status: 201 },
    );
  } catch (err) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
