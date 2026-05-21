import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import type { Role } from "@prisma/client";

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  image?: string | null;
  workspaceId?: string | null;
};

export type AppSession = {
  user: SessionUser;
};

export const SESSION_COOKIE = "af_session";

function getSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!raw) throw new Error("AUTH_SECRET env variable is not set");
  return new TextEncoder().encode(raw);
}

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    image: user.image ?? null,
    workspaceId: user.workspaceId ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      id: payload.id as string,
      name: payload.name as string,
      email: payload.email as string,
      role: payload.role as Role,
      image: (payload.image as string | null | undefined) ?? null,
      workspaceId: (payload.workspaceId as string | null | undefined) ?? null,
    };
  } catch {
    return null;
  }
}

/** Server Components & API Routes only — reads the cookie via next/headers */
export async function getSession(): Promise<AppSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const user = await verifyToken(token);
  if (!user) return null;
  return { user };
}

/** Sets the af_session cookie on the given response. */
export function setSessionCookie(res: Response, token: string) {
  // NextResponse has its own helper; this is for plain Response usage
  res.headers.append(
    "Set-Cookie",
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${
      30 * 24 * 60 * 60
    }${process.env.NODE_ENV === "production" ? "; Secure" : ""}`,
  );
}
