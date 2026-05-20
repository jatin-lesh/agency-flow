"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Plus, Building2, Globe, FolderKanban } from "lucide-react";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { VisibilityBadge } from "@/components/shared/VisibilityBadge";
import { VisibilitySelect } from "@/components/shared/VisibilitySelect";
import { canManage } from "@/lib/utils";
import { Visibility } from "@prisma/client";

interface Client {
  id: string; name: string; industry?: string; website?: string;
  visibility: Visibility;
  _count: { projects: number };
  pocs: { id: string; name: string; isPrimary: boolean }[];
}

export default function ClientsPage() {
  const { data: session } = useSession();
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [industry, setIndustry] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [visibility, setVisibility] = useState<Visibility>("TEAM");
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/clients");
    if (res.ok) setClients(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  async function create(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const res = await fetch("/api/clients", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, industry, website, notes, visibility }),
    });
    setSaving(false);
    if (res.ok) { setOpen(false); setName(""); setIndustry(""); setWebsite(""); setNotes(""); load(); }
  }

  const filtered = clients.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
  const isManager = session && canManage(session.user.role);

  return (
    <div className="flex flex-col flex-1">
      <Header
        title="Clients"
        subtitle={`${clients.length} client${clients.length !== 1 ? "s" : ""}`}
        action={isManager && (
          <Button size="sm" onClick={() => setOpen(true)}>
            <Plus className="h-4 w-4" /> Add Client
          </Button>
        )}
      />

      <div className="p-6 space-y-4">
        <Input placeholder="Search clients…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Building2 className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No clients found</p>
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const primary = c.pocs.find((p) => p.isPrimary) ?? c.pocs[0];
            return (
              <Link key={c.id} href={`/clients/${c.id}`}>
                <Card className="hover:shadow-md hover:border-indigo-200 transition-all cursor-pointer h-full">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shrink-0">
                          {c.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">{c.name}</p>
                          {c.industry && <p className="text-xs text-slate-500">{c.industry}</p>}
                        </div>
                      </div>
                      <VisibilityBadge visibility={c.visibility} />
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                      <span className="flex items-center gap-1"><FolderKanban className="h-3 w-3" /> {c._count.projects} project{c._count.projects !== 1 ? "s" : ""}</span>
                      {c.pocs.length > 0 && <span>{c.pocs.length} POC{c.pocs.length !== 1 ? "s" : ""}</span>}
                    </div>

                    {primary && (
                      <p className="text-xs text-slate-400">
                        POC: <span className="text-slate-600 font-medium">{primary.name}</span>
                      </p>
                    )}

                    {c.website && (
                      <a
                        href={c.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:underline"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Globe className="h-3 w-3" /> {c.website.replace(/^https?:\/\//, "")}
                      </a>
                    )}
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
          <form onSubmit={create} className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <Label>Company Name *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Acme Corp" autoFocus required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Industry</Label>
                <Input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="E-commerce" />
              </div>
              <div className="space-y-1.5">
                <Label>Website</Label>
                <Input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="https://..." type="url" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Notes</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Internal notes about this client…" />
            </div>
            <VisibilitySelect value={visibility} onChange={setVisibility} />
            <div className="flex justify-end gap-2 pt-1">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={saving}>{saving ? "Saving…" : "Add Client"}</Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
