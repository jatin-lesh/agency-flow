import { redirect } from "next/navigation";
import Link from "next/link";
import { Zap, LogOut } from "lucide-react";
import { auth } from "@/lib/auth";
import LogoutButton from "@/components/auth/LogoutButton";

export default async function PortalLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6">
        <Link href="/portal" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600">
            <Zap className="h-3.5 w-3.5 text-white" />
          </div>
          <span className="text-sm font-bold tracking-tight text-slate-900">Lesh Space</span>
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-slate-600 hidden sm:inline">{session.user.name}</span>
          <LogoutButton>
            <LogOut className="h-3.5 w-3.5" /> Sign out
          </LogoutButton>
        </div>
      </header>
      <nav className="border-b border-slate-200 bg-white px-6">
        <div className="flex gap-6">
          <Link href="/portal" className="py-3 text-sm font-medium text-slate-700 hover:text-indigo-600">
            Overview
          </Link>
          <Link href="/portal/tasks" className="py-3 text-sm font-medium text-slate-700 hover:text-indigo-600">
            Tasks
          </Link>
        </div>
      </nav>
      <main className="px-6 py-6">{children}</main>
    </div>
  );
}
