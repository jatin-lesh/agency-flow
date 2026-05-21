"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard,
  Users2,
  FolderKanban,
  CheckSquare,
  Contact2,
  UsersRound,
  LogOut,
  Zap,
  ChevronDown,
  Plus,
  Check,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users2 },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/pocs", label: "POC Management", icon: Contact2 },
  { href: "/team", label: "Team", icon: UsersRound },
];

interface SidebarProps {
  user: { name: string; email: string; image?: string | null; role: string; workspaceId?: string | null };
}

interface WorkspaceItem {
  id: string;
  name: string;
  role: string;
}

export default function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [workspaces, setWorkspaces] = useState<WorkspaceItem[]>([]);
  const [wsOpen, setWsOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  useEffect(() => {
    fetch("/api/workspaces")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setWorkspaces(Array.isArray(data) ? data : []))
      .catch(() => setWorkspaces([]));
  }, []);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function switchWorkspace(id: string) {
    const res = await fetch("/api/workspaces/switch", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ workspaceId: id }),
    });
    if (res.ok) {
      setWsOpen(false);
      window.location.reload();
    }
  }

  async function createWorkspace(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    const res = await fetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      const ws = await res.json();
      await switchWorkspace(ws.id);
    }
  }

  const activeWs =
    workspaces.find((w) => w.id === user.workspaceId) ?? workspaces[0];

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-60 flex-col bg-slate-900 text-white">
      {/* Logo + Workspace switcher */}
      <div className="border-b border-slate-800">
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600">
            <Zap className="h-4 w-4 text-white" />
          </div>
          <span className="text-base font-bold tracking-tight">Lesh Space</span>
        </div>

        <div className="relative px-3 pb-3">
          <button
            type="button"
            onClick={() => setWsOpen((o) => !o)}
            className="flex w-full items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-left text-sm hover:bg-slate-700 transition-colors"
          >
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider text-slate-500">
                Workspace
              </p>
              <p className="truncate font-medium text-white">
                {activeWs?.name ?? "No workspace"}
              </p>
            </div>
            <ChevronDown className="h-4 w-4 text-slate-400 shrink-0" />
          </button>

          {wsOpen && (
            <div className="absolute left-3 right-3 top-full z-50 mt-1 rounded-lg border border-slate-700 bg-slate-800 shadow-xl">
              <div className="max-h-60 overflow-y-auto p-1">
                {workspaces.map((w) => (
                  <button
                    key={w.id}
                    type="button"
                    onClick={() => switchWorkspace(w.id)}
                    className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm hover:bg-slate-700"
                  >
                    <span className="truncate">{w.name}</span>
                    {activeWs?.id === w.id && (
                      <Check className="h-3.5 w-3.5 text-indigo-400" />
                    )}
                  </button>
                ))}
                {workspaces.length === 0 && (
                  <p className="px-2 py-2 text-xs text-slate-500">
                    No workspaces yet
                  </p>
                )}
              </div>
              <div className="border-t border-slate-700 p-2">
                {creating ? (
                  <form onSubmit={createWorkspace} className="space-y-2">
                    <input
                      autoFocus
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      placeholder="Workspace name"
                      className="w-full rounded-md bg-slate-700 px-2 py-1.5 text-sm text-white placeholder:text-slate-500 outline-none focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="flex gap-1.5">
                      <button
                        type="submit"
                        className="flex-1 rounded-md bg-indigo-600 px-2 py-1 text-xs font-medium hover:bg-indigo-500"
                      >
                        Create
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setCreating(false);
                          setNewName("");
                        }}
                        className="flex-1 rounded-md bg-slate-700 px-2 py-1 text-xs hover:bg-slate-600"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <button
                    type="button"
                    onClick={() => setCreating(true)}
                    className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-300 hover:bg-slate-700 hover:text-white"
                  >
                    <Plus className="h-3.5 w-3.5" /> New workspace
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 space-y-0.5">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-indigo-600 text-white"
                  : "text-slate-400 hover:bg-slate-800 hover:text-white"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-slate-800 p-4 space-y-3">
        <Link
          href="/profile"
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <Settings className="h-3.5 w-3.5" /> Profile & Notifications
        </Link>
        <div className="flex items-center gap-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={user.image ?? undefined} />
            <AvatarFallback className="bg-indigo-800 text-indigo-100 text-xs">
              {user.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user.name}</p>
            <p className="text-xs text-slate-400 truncate capitalize">{user.role.toLowerCase().replace("_", " ")}</p>
          </div>
          <button
            onClick={handleLogout}
            className="text-slate-400 hover:text-white transition-colors"
            title="Sign out"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
