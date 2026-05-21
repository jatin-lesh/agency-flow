"use client";
import { useEffect, useState } from "react";
import Header from "@/components/layout/Header";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Profile {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  whatsappEnabled: boolean;
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
        setWhatsappEnabled(data.whatsappEnabled ?? false);
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setInfo("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone, whatsappEnabled }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setInfo("Saved.");
    }
    setSaving(false);
    setTimeout(() => setInfo(""), 2000);
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Profile" subtitle="Update your account and notification preferences" />
      <div className="p-6 max-w-2xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>{profile?.email}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={save} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label>Phone (with country code, e.g. +14155551234)</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+14155551234"
                />
                <p className="text-xs text-slate-500">Used for WhatsApp notifications.</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  id="wa"
                  type="checkbox"
                  checked={whatsappEnabled}
                  onChange={(e) => setWhatsappEnabled(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <Label htmlFor="wa" className="cursor-pointer">
                  Enable WhatsApp notifications for tasks
                </Label>
              </div>
              <div className="flex items-center gap-3">
                <Button type="submit" disabled={saving}>
                  {saving ? "Saving…" : "Save changes"}
                </Button>
                {info && <span className="text-sm text-emerald-600">{info}</span>}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
