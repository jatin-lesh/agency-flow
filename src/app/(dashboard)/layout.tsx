import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { signToken, SESSION_COOKIE } from "@/lib/session";
import { cookies } from "next/headers";
import Sidebar from "@/components/layout/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  if (session.user.role === "CLIENT_USER") redirect("/portal");

  // Ensure user has a workspaceId in their session — if not, attach the first one they belong to
  let workspaceId = session.user.workspaceId ?? null;
  if (!workspaceId) {
    const member = await db.workspaceMember.findFirst({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
    if (member) {
      workspaceId = member.workspaceId;
      const token = await signToken({ ...session.user, workspaceId });
      const cookieStore = await cookies();
      cookieStore.set(SESSION_COOKIE, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 30 * 24 * 60 * 60,
      });
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar user={{ ...session.user, workspaceId }} />
      <main className="flex-1 ml-60 overflow-y-auto flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}
