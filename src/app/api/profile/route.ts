import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsappEnabled: true,
      avatar: true,
      role: true,
    },
  });
  return NextResponse.json(user);
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const data: { phone?: string | null; whatsappEnabled?: boolean; name?: string } = {};
  if (typeof body.phone === "string") data.phone = body.phone || null;
  if (typeof body.whatsappEnabled === "boolean") data.whatsappEnabled = body.whatsappEnabled;
  if (typeof body.name === "string" && body.name.trim()) data.name = body.name.trim();

  const user = await db.user.update({
    where: { id: session.user.id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      whatsappEnabled: true,
    },
  });
  return NextResponse.json(user);
}
