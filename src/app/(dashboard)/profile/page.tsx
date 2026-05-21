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
  const [saving, setSaving] = useState(false);
  const [info, setInfo] = useState("");

  // Delete account state
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setName(data.name ?? "");
        setPhone(data.phone ?? "");
      });
  }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setInfo("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, phone }),
    });
    if (res.ok) {
      const data = await res.json();
      setProfile(data);
      setInfo("Saved.");
    }
    setSaving(false);
    setTimeout(() => setInfo(""), 2000);
  }

  async function deleteAccount() {
    if (deleteConfirm !== "DELETE") {
      setDeleteError('Type DELETE in all caps to confirm.');
      return;
    }
    setDeleting(true);
    setDeleteError("");
    const res = await fetch("/api/profile", { method: "DELETE" });
    if (res.ok) {
      window.location.href = "/login";
    } else {
      const data = await res.json().catch(() => ({}));
      setDeleteError(data.error ?? "Something went wrong.");
      setDeleting(false);
    }
  }

  return (
    <div className="flex flex-col flex-1">
      <Header title="Profile" subtitle="Manage your account" />
      <div className="p-6 max-w-2xl space-y-6">

        {/* Account details */}
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
                <Label>Phone</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+14155551234"
                />
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

        {/* Danger zone */}
        <Card className="border-red-200 bg-red-50/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-red-700 text-base">Danger Zone</CardTitle>
            <CardDescription className="text-red-600/80">
              Permanently delete your account and all associated data. This cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-red-700">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </Label>
              <Input
                value={deleteConfirm}
                onChange={(e) => { setDeleteConfirm(e.target.value); setDeleteError(""); }}
                placeholder="DELETE"
                className="border-red-300 focus-visible:ring-red-400 max-w-xs"
              />
            </div>
            {deleteError && <p className="text-sm text-red-600">{deleteError}</p>}
            <Button
              variant="destructive"
              disabled={deleting}
              onClick={deleteAccount}
            >
              {deleting ? "Deleting…" : "Delete my account"}
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
