import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "af_session";

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET ?? "";
  return new TextEncoder().encode(raw);
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // API routes handle their own auth (return 401) — middleware only guards page navigation
  if (pathname.startsWith("/api/")) return NextResponse.next();

  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  let isLoggedIn = false;

  if (token) {
    try {
      await jwtVerify(token, getSecret());
      isLoggedIn = true;
    } catch {
      isLoggedIn = false;
    }
  }

  if (isAuthPage) {
    if (isLoggedIn)
      return NextResponse.redirect(new URL("/dashboard", req.url));
    return NextResponse.next();
  }

  if (!isLoggedIn)
    return NextResponse.redirect(new URL("/login", req.url));

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
