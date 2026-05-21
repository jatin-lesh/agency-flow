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
    pathname.startsWith("/login") ||
    pathname.startsWith("/register") ||
    pathname.startsWith("/verify-otp") ||
    pathname.startsWith("/invitations/");

  const isPortal = pathname.startsWith("/portal");
  const isDashboard =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/clients") ||
    pathname.startsWith("/projects") ||
    pathname.startsWith("/tasks") ||
    pathname.startsWith("/pocs") ||
    pathname.startsWith("/team") ||
    pathname.startsWith("/workspaces") ||
    pathname.startsWith("/profile");

  const token = req.cookies.get(SESSION_COOKIE)?.value;
  let isLoggedIn = false;
  let role: string | null = null;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, getSecret());
      isLoggedIn = true;
      role = (payload.role as string) ?? null;
    } catch {
      isLoggedIn = false;
    }
  }

  // Auth pages: allow always for guests; if logged in redirect based on role
  if (isAuthPage) {
    if (isLoggedIn) {
      const dest = role === "CLIENT_USER" ? "/portal" : "/dashboard";
      return NextResponse.redirect(new URL(dest, req.url));
    }
    return NextResponse.next();
  }

  // Portal: any logged-in user allowed; otherwise redirect to login
  if (isPortal) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url));
    return NextResponse.next();
  }

  // Dashboard: must be logged in AND not a CLIENT_USER
  if (isDashboard) {
    if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url));
    if (role === "CLIENT_USER")
      return NextResponse.redirect(new URL("/portal", req.url));
    return NextResponse.next();
  }

  // Any other protected path
  if (!isLoggedIn) return NextResponse.redirect(new URL("/login", req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
