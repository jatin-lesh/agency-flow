"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { UsersRound, CheckSquare, Trash2, UserPlus } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { isAdmin, ROLE_LABELS } from "@/lib/utils";
import { Role } from "@prisma/client";

interface Member {
  id: string; name: string; email: string; role: Role;
  avatar?: string | null; createdAt: string;
  _count: { assignedTasks: number };
}

const ROLE_BADGE_VARIANT: Record<Role, "default" | "secondary" | "info" | "warning"> = {
  ADMIN: "default", MANAGER: "info", MEMBER: "secondary", CLIENT_USER: "warning",
};

export default function TeamPage() {
  const { data: session } = useSession();
  const [members, setMembers] = useState<Member[]>([]);
  const [search, setSearch] = useState("");

  // Invite dialog
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("MEMBER");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/team");
    if (res.ok) setMembers(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function changeRole(userId: string, role: Role) {
    await fetch("/api/team", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, role }),
    });
    load();
  }

  async function deleteUser(userId: string, name: string) {
    if (!confirm(`Delete ${name}'s account permanently? This cannot be undone.`)) return;
    await fetch("/api/team", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    load();
  }

  async function sendInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.workspaceId) {
      setInviteMsg({ ok: false, text: "No active workspace. Switch to a workspace first." });
      return;
    }
    setInviting(true);
    setInviteMsg(null);
    const res = await fetch(`/api/workspaces/${session.user.workspaceId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setInviteMsg({ ok: true, text: `Invite sent to ${inviteEmail}.` });
      setInviteEmail("");
      setInviteRole("MEMBER");
    } else {
      setInviteMsg({ ok: false, text: data.error ?? "Failed to send invite." });
    }
    setInviting(false);
  }

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminUser = session && isAdmin(session.user.role);

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Team"
        subtitle={`${members.length} member${members.length !== 1 ? "s" : ""}`}
        action={
          adminUser ? (
            <Button size="sm" onClick={() => { setInviteOpen(true); setInviteMsg(null); }}>
              <UserPlus className="h-4 w-4" /> Invite member
            </Button>
          ) : undefined
        }
      />

      <div className="p-6 space-y-4">
        <Input
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-sm"
        />

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <UsersRound className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No members found</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((m) => (
            <Card key={m.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <Avatar className="h-11 w-11 shrink-0">
                    <AvatarImage src={m.avatar ?? undefined} />
                    <AvatarFallback className="text-sm font-semibold">{m.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900 truncate">{m.name}</p>
                      {m.id === session?.user?.id && <Badge variant="outline" className="text-[10px] py-0">You</Badge>}
                    </div>
                    <p className="text-xs text-slate-500 truncate">{m.email}</p>
                    <div className="flex items-center gap-2 pt-1">
                      {adminUser && m.id !== session?.user?.id ? (
                        <Select value={m.role} onValueChange={(v) => changeRole(m.id, v as Role)}>
                          <SelectTrigger className="h-6 text-xs w-36 border-0 bg-transparent p-0 shadow-none focus:ring-0">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="ADMIN">Admin</SelectItem>
                            <SelectItem value="MANAGER">Manager</SelectItem>
                            <SelectItem value="MEMBER">Member</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge variant={ROLE_BADGE_VARIANT[m.role]}>{ROLE_LABELS[m.role]}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 flex items-center gap-1 pt-0.5">
                      <CheckSquare className="h-3 w-3" /> {m._count.assignedTasks} task{m._count.assignedTasks !== 1 ? "s" : ""} assigned
                    </p>
                  </div>
                  {adminUser && m.id !== session?.user?.id && (
                    <button
                      onClick={() => deleteUser(m.id, m.name)}
                      className="shrink-0 p-1.5 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                      title="Delete account"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Invite member dialog */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) setInviteMsg(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite team member</DialogTitle>
            <DialogDescription>
              They&apos;ll receive an email with a link to create their account and join your workspace.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sendInvite} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Email address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@agency.com"
                required
                autoFocus
              />
            </div>
            <div className="space-y-1.5">
              <Label>Role</Label>
              <Select value={inviteRole} onValueChange={setInviteRole}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADMIN">
                    <span className="font-medium">Admin</span>
                    <span className="text-slate-400 ml-2 text-xs">Full access, can manage team</span>
                  </SelectItem>
                  <SelectItem value="MANAGER">
                    <span className="font-medium">Manager</span>
                    <span className="text-slate-400 ml-2 text-xs">Manage projects and tasks</span>
                  </SelectItem>
                  <SelectItem value="MEMBER">
                    <span className="font-medium">Member</span>
                    <span className="text-slate-400 ml-2 text-xs">Work on assigned tasks</span>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            {inviteMsg && (
              <p className={`text-sm ${inviteMsg.ok ? "text-emerald-600" : "text-red-500"}`}>
                {inviteMsg.text}
              </p>
            )}
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={inviting}>
                {inviting ? "Sending…" : "Send invite"}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
