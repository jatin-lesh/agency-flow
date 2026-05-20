"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Plus, FolderKanban, CheckSquare, Calendar } from "lucide-react";
import { format } from "date-fns";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { VisibilitySelect } from "@/components/shared/VisibilitySelect";
import { canManage } from "@/lib/utils";
import { Visibility } from "@prisma/client";

interface Project {
  id: string; name: string; description?: string; status: string;
  visibility: Visibility; dueDate?: string;
  client: { id: string; name: string };
  _count: { tasks: number };
}
interface Client { id: string; name: string }

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: "success", ON_HOLD: "warning", COMPLETED: "info", ARCHIVED: "secondary",
};

export default function ProjectsPage() {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const preClientId = searchParams.get("clientId") ?? "";

  const [projects, setProjects] = useState<Project[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [clientId, setClientId] = useState(preClientId);
  const [dueDate, setDueDate] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("TEAM");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [filterClient, setFilterClient] = useState(preClientId);

  const load = useCallback(async () => {
    const [pRes, cRes] = await Promise.all([fetch("/api/projects"), fetch("/api/clients")]);
    if (pRes.ok) setProjects(await pRes.json());
    if (cRes.ok) setClients(await cRes.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, clientId, dueDate: dueDate || null, visibility }),
    });
    setSaving(false);
    if (res.ok) { setOpen(false); setName(""); setDescription(""); setDueDate(""); load(); }
  }

  const filtered = projects.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.client.name.toLowerCase().includes(search.toLowerCase());
    const matchClient = !filterClient || p.client.id === filterClient;
    return matchSearch && matchClient;
  });

  const isManager = session && canManage(session.user.role);

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Projects"
        subtitle={`${projects.length} project${projects.length !== 1 ? "s" : ""}`}
        action={isManager && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> New Project
          </Button>
        )}
      />

      <div className="p-6 space-y-4">
        <div className="flex gap-3 flex-wrap">
          <Input placeholder="Search projects…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-xs" />
          <Select value={filterClient || "all"} onValueChange={(v) => setFilterClient(v === "all" ? "" : v)}>
            <SelectTrigger className="w-48"><SelectValue placeholder="All clients" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>
              {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <FolderKanban className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No projects found</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Link key={p.id} href={`/projects/${p.id}`}>
              <Card className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer h-full">
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="font-semibold text-slate-900">{p.name}</p>
                      <p className="text-xs text-indigo-600 font-medium mt-0.5">{p.client.name}</p>
                    </div>
                    <Badge variant={STATUS_COLORS[p.status] as "success" | "warning" | "info" | "secondary"} className="shrink-0">
                      {p.status.replace("_", " ")}
                    </Badge>
                  </div>

                  {p.description && <p className="text-xs text-slate-500 line-clamp-2">{p.description}</p>}

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span className="flex items-center gap-1"><CheckSquare className="h-3 w-3" /> {p._count.tasks} tasks</span>
                    {p.dueDate && <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{format(new Date(p.dueDate), "MMM d, yyyy")}</span>}
                  </div>

                  <VisibilityBadge visibility={p.visibility} />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New Project</DialogTitle></DialogHeader>
          <form onSubmit={create} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Project Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q3 Social Campaign" autoFocus required />
            </div>
            <div className="space-y-1.5">
              <Label>Client *</Label>
              <Select value={clientId} onValueChange={setClientId} required>
                <SelectTrigger><SelectValue placeholder="Select client" /></SelectTrigger>
                <SelectContent>
                  {clients.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Project goals and scope…" />
            </div>
            <div className="space-y-1.5">
              <Label>Due Date</Label>
              <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
            </div>
            <VisibilitySelect value={visibility} onChange={setVisibility} />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving || !clientId}>{saving ? "Saving…" : "Create Project"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
