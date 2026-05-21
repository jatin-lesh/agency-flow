"use client";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

interface Invitation {
  email: string;
  role: string;
  workspace: { id: string; name: string };
}

export default function InvitationPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const searchParams = useSearchParams();
  const clientId = searchParams.get("client");

  const [inv, setInv] = useState<Invitation | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`/api/invitations/${token}`)
      .then(async (r) => {
        if (!r.ok) {
          const d = await r.json().catch(() => ({}));
          throw new Error(d.error ?? "Invalid invitation");
        }
        return r.json();
      })
      .then((data) => setInv(data))
      .catch((e: Error) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function accept(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setErr("");
    const res = await fetch(`/api/invitations/${token}/accept`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, password, clientId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setErr(data.error ?? "Failed to accept");
      setSubmitting(false);
      return;
    }
    window.location.href = data.role === "CLIENT_USER" ? "/portal" : "/dashboard";
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-600 shadow-lg">
            <Zap className="h-6 w-6 text-white" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-white">Lesh Space</h1>
            <p className="text-slate-400 text-sm mt-1">Your agency. Your space.</p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-white">Accept invitation</CardTitle>
            <CardDescription className="text-slate-400">
              {loading ? "Loading…" : inv ? `Join ${inv.workspace.name}` : "Invitation"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {err && <p className="text-sm text-red-400 mb-3">{err}</p>}
            {inv && (
              <form onSubmit={accept} className="space-y-4">
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Email</Label>
                  <Input
                    value={inv.email}
                    disabled
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Full Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Smith"
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-slate-300">Password</Label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    minLength={8}
                    required
                    className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500"
                  />
                </div>
                <Button type="submit" disabled={submitting} className="w-full">
                  {submitting ? "Joining…" : "Join workspace"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
