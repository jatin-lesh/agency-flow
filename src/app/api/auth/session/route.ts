import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  // Always 200 — null means unauthenticated, object means authenticated
  return NextResponse.json(session);
}
