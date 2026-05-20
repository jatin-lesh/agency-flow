import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { canManage } from "@/lib/utils";

export async function GET(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const clientId = searchParams.get("clientId");

  const pocs = await db.pOC.findMany({
    where: clientId ? { clientId } : undefined,
    include: { client: { select: { id: true, name: true } } },
    orderBy: [{ isPrimary: "desc" }, { name: "asc" }],
  });

  return NextResponse.json(pocs);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canManage(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json();
  const { name, email, phone, jobTitle, notes, isPrimary, clientId } = body;

  if (!name || !email || !clientId) {
    return NextResponse.json({ error: "name, email, clientId required" }, { status: 400 });
  }

  // Only one primary per client
  if (isPrimary) {
    await db.pOC.updateMany({
      where: { clientId },
      data: { isPrimary: false },
    });
  }

  const poc = await db.pOC.create({
    data: { name, email, phone, jobTitle, notes, isPrimary: isPrimary ?? false, clientId },
    include: { client: { select: { id: true, name: true } } },
  });

  return NextResponse.json(poc, { status: 201 });
}
