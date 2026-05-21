import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sendOTP } from "@/lib/email";

function genCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email) {
      return NextResponse.json({ error: "Missing email" }, { status: 400 });
    }

    const user = await db.user.findUnique({ where: { email } });
    if (!user) {
      // Don't reveal whether email is registered
      return NextResponse.json({ ok: true });
    }

    const code = genCode();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    await db.oTPCode.create({
      data: { email, code, purpose: "REGISTRATION", expiresAt },
    });
    await sendOTP(email, code, "REGISTRATION");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("OTP resend error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
