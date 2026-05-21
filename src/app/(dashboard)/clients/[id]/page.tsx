"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import Link from "next/link";
import { Plus, Mail, Phone, Briefcase, Star, FolderKanban, CheckSquare, ArrowLeft, UserPlus } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { canManage } from "@/lib/utils";
import { Visibility } from "@prisma/client";

interface POC { id: string; name: string; email: string; phone?: string; jobTitle?: string; notes?: string; isPrimary: boolean }
interface Project { id: string; name: string; status: string; visibility: Visibility; dueDate?: string; _count: { tasks: number } }
interface Client { id: string; name: string; industry?: string; website?: string; notes?: string; visibility: Visibility; pocs: POC[]; projects: Project[] }

export default function ClientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: session } = useSession();
  const [client, setClient] = useState<Client | null>(null);
  const [pocOpen, setPocOpen] = useState(false);
  const [pocName, setPocName] = useState("");
  const [pocEmail, setPocEmail] = useState("");
  const [pocPhone, setPocPhone] = useState("");
  const [pocTitle, setPocTitle] = useState("");
  const [pocNotes, setPocNotes] = useState("");
  const [pocPrimary, setPocPrimary] = useState(false);
  const [saving, setSaving] = useState(false);

  // Portal invite state
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch(`/api/clients/${id}`);
    if (res.ok) setClient(await res.json());
  }, [id]);

  useEffect(() => { load(); }, [load]);

  async function createPOC(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/pocs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: pocName, email: pocEmail, phone: pocPhone, jobTitle: pocTitle, notes: pocNotes, isPrimary: pocPrimary, clientId: id }),
    });
    setSaving(false);
    if (res.ok) { setPocOpen(false); setPocName(""); setPocEmail(""); setPocPhone(""); setPocTitle(""); setPocNotes(""); setPocPrimary(false); load(); }
  }

  async function setPrimary(pocId: string) {
    await fetch(`/api/pocs/${pocId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isPrimary: true }) });
    load();
  }

  async function deletePOC(pocId: string) {
    if (!confirm("Delete this POC?")) return;
    await fetch(`/api/pocs/${pocId}`, { method: "DELETE" });
    load();
  }

  async function sendPortalInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!session?.user?.workspaceId) {
      setInviteMsg({ ok: false, text: "No active workspace. Please switch to a workspace first." });
      return;
    }
    setInviting(true);
    setInviteMsg(null);
    const res = await fetch(`/api/workspaces/${session.user.workspaceId}/invite`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail, role: "CLIENT", clientId: id }),
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok) {
      setInviteMsg({ ok: true, text: `Invite sent to ${inviteEmail}. They'll receive an email to create their account.` });
      setInviteEmail("");
    } else {
      setInviteMsg({ ok: false, text: data.error ?? "Failed to send invite." });
    }
    setInviting(false);
  }

  const isManager = session && canManage(session.user.role);

  if (!client) return <div className="flex-1 flex items-center justify-center text-slate-400">Loading…</div>;

  return (
    <div className="flex flex-col flex-1">
      <Header
        title={client.name}
        subtitle={client.industry}
        action={
          <div className="flex gap-2">
            <Link href="/clients"><Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4" /> Back</Button></Link>
            {isManager && (
              <Button size="sm" variant="outline" onClick={() => { setInviteOpen(true); setInviteMsg(null); }}>
                <UserPlus className="h-4 w-4" /> Invite to portal
              </Button>
            )}
            {isManager && <Button size="sm" onClick={() => setPocOpen(true)}><Plus className="h-4 w-4" /> Add POC</Button>}
          </div>
        }
      />

      <div className="p-6 space-y-6">
        <div className="flex items-center gap-3 flex-wrap">
          <VisibilityBadge visibility={client.visibility} />
          {client.website && <a href={client.website} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline">{client.website}</a>}
          {client.notes && <p className="text-sm text-slate-500">{client.notes}</p>}
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* POCs */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Points of Contact</CardTitle>
              <Badge variant="secondary">{client.pocs.length}</Badge>
            </CardHeader>
            <CardContent className="space-y-3">
              {client.pocs.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No contacts added yet</p>}
              {client.pocs.map((poc) => (
                <div key={poc.id} className="flex items-start gap-3 p-3 rounded-lg border border-slate-100 hover:border-slate-200 transition-colors">
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-slate-900">{poc.name}</p>
                      {poc.isPrimary && <Badge variant="success" className="text-[10px] py-0">Primary</Badge>}
                    </div>
                    {poc.jobTitle && <p className="text-xs text-slate-500 flex items-center gap-1"><Briefcase className="h-3 w-3" />{poc.jobTitle}</p>}
                    <p className="text-xs text-slate-500 flex items-center gap-1"><Mail className="h-3 w-3" />{poc.email}</p>
                    {poc.phone && <p className="text-xs text-slate-500 flex items-center gap-1"><Phone className="h-3 w-3" />{poc.phone}</p>}
                    {poc.notes && <p className="text-xs text-slate-400 italic">{poc.notes}</p>}
                  </div>
                  {isManager && (
                    <div className="flex gap-1 shrink-0">
                      {!poc.isPrimary && (
                        <button onClick={() => setPrimary(poc.id)} className="text-slate-400 hover:text-amber-500 transition-colors" title="Set as primary">
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      <button onClick={() => deletePOC(poc.id)} className="text-slate-400 hover:text-red-500 transition-colors text-xs px-1">✕</button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Projects */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-base">Projects</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{client.projects.length}</Badge>
                {isManager && (
                  <Link href={`/projects?clientId=${id}`}>
                    <Button size="sm" variant="outline"><Plus className="h-3 w-3" /> New</Button>
                  </Link>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {client.projects.length === 0 && <p className="text-sm text-slate-400 text-center py-4">No projects yet</p>}
              {client.projects.map((p) => (
                <Link key={p.id} href={`/projects/${p.id}`}>
                  <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 transition-all">
                    <FolderKanban className="h-4 w-4 text-indigo-500 shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">{p.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-1">
                        <CheckSquare className="h-3 w-3" /> {p._count.tasks} tasks
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <VisibilityBadge visibility={p.visibility} />
                    </div>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Invite to Portal Dialog */}
      <Dialog open={inviteOpen} onOpenChange={(o) => { setInviteOpen(o); if (!o) setInviteMsg(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite client to portal</DialogTitle>
            <DialogDescription>
              Send an email invite so your client can create an account and view their projects &amp; tasks on the portal.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={sendPortalInvite} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Client&apos;s email address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="client@example.com"
                required
                autoFocus
              />
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

      {/* Add POC Dialog */}
      <Dialog open={pocOpen} onOpenChange={setPocOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Point of Contact</DialogTitle></DialogHeader>
          <form onSubmit={createPOC} className="space-y-4 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={pocName} onChange={(e) => setPocName(e.target.value)} required autoFocus />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={pocEmail} onChange={(e) => setPocEmail(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={pocPhone} onChange={(e) => setPocPhone(e.target.value)} type="tel" />
              </div>
              <div className="space-y-1.5">
                <Label>Job Title</Label>
                <Input value={pocTitle} onChange={(e) => setPocTitle(e.target.value)} placeholder="Marketing Director" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={pocNotes} onChange={(e) => setPocNotes(e.target.value)} placeholder="Preferred contact hours, notes…" />
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={pocPrimary} onChange={(e) => setPocPrimary(e.target.checked)} className="rounded" />
              <span className="text-sm text-slate-700">Set as primary contact</span>
            </label>
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setPocOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add Contact"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
