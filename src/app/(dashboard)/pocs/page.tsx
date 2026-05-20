"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "@/components/auth/SessionProvider";
import Link from "next/link";
import { Mail, Phone, Briefcase, Star, Building2 } from "lucide-react";
import Header from "@/components/layout/Header";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { canManage } from "@/lib/utils";

interface POC {
  id: string; name: string; email: string; phone?: string;
  jobTitle?: string; notes?: string; isPrimary: boolean;
  client: { id: string; name: string };
}

export default function POCsPage() {
  const { data: session } = useSession();
  const [pocs, setPocs] = useState<POC[]>([]);
  const [search, setSearch] = useState("");

  const load = useCallback(async () => {
    const res = await fetch("/api/pocs");
    if (res.ok) setPocs(await res.json());
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = pocs.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.email.toLowerCase().includes(search.toLowerCase()) ||
    p.client.name.toLowerCase().includes(search.toLowerCase()) ||
    p.jobTitle?.toLowerCase().includes(search.toLowerCase())
  );

  const isManager = session && canManage(session.user.role);

  // Group by client
  const byClient = filtered.reduce<Record<string, { clientName: string; clientId: string; pocs: POC[] }>>((acc, p) => {
    if (!acc[p.client.id]) acc[p.client.id] = { clientName: p.client.name, clientId: p.client.id, pocs: [] };
    acc[p.client.id].pocs.push(p);
    return acc;
  }, {});

  async function deletePOC(pocId: string) {
    if (!confirm("Delete this POC?")) return;
    await fetch(`/api/pocs/${pocId}`, { method: "DELETE" });
    load();
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="POC Management" subtitle={`${pocs.length} contact${pocs.length !== 1 ? "s" : ""} across all clients`} />

      <div className="p-6 space-y-6">
        <Input placeholder="Search contacts, emails, titles, clients…" value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-sm" />

        {Object.values(byClient).length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <Building2 className="h-10 w-10 mb-3 opacity-30" />
            <p className="text-sm">No contacts found. Add contacts from a client page.</p>
          </div>
        )}

        {Object.values(byClient).map(({ clientId, clientName, pocs: clientPocs }) => (
          <div key={clientId}>
            <div className="flex items-center gap-2 mb-3">
              <Link href={`/clients/${clientId}`} className="text-sm font-semibold text-slate-800 hover:text-indigo-600 transition-colors">{clientName}</Link>
              <Badge variant="secondary">{clientPocs.length}</Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {clientPocs.map((poc) => (
                <Card key={poc.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-semibold text-slate-900">{poc.name}</p>
                          {poc.isPrimary && <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />}
                        </div>
                        {poc.jobTitle && (
                          <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                            <Briefcase className="h-3 w-3" />{poc.jobTitle}
                          </p>
                        )}
                      </div>
                      {isManager && (
                        <button onClick={() => deletePOC(poc.id)} className="text-slate-300 hover:text-red-400 transition-colors text-xs shrink-0">✕</button>
                      )}
                    </div>

                    <a href={`mailto:${poc.email}`} className="flex items-center gap-1.5 text-xs text-indigo-600 hover:underline">
                      <Mail className="h-3 w-3" />{poc.email}
                    </a>
                    {poc.phone && (
                      <a href={`tel:${poc.phone}`} className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-700">
                        <Phone className="h-3 w-3" />{poc.phone}
                      </a>
                    )}
                    {poc.notes && <p className="text-xs text-slate-400 italic line-clamp-2">{poc.notes}</p>}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
