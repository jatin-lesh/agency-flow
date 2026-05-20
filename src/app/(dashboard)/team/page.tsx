"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import { UsersRound, CheckSquare } from "lucide-react";
import Header from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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

  const filtered = members.filter((m) =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  );

  const adminUser = session && isAdmin(session.user.role);

  return (
    <div className="flex flex-col flex-1">
      <Header title="Team" subtitle={`${members.length} member${members.length !== 1 ? "s" : ""}`} />

      <div className="p-6 space-y-4">
        <Input placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

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
                            <SelectItem value="CLIENT_USER">Client</SelectItem>
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
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
