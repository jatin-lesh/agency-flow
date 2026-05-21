"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 8) { setError("Password must be at least 8 characters."); return; }
    setLoading(true);
    setError("");

    try {
      const regRes = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });

      const data = await regRes.json().catch(() => ({}));

      if (!regRes.ok) {
        setError(data.error ?? "Registration failed. Please try again.");
        setLoading(false);
        return;
      }

      // If verification is required, send the user to verify-otp
      if (data.requiresVerification) {
        router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
        return;
      }

      // Legacy fallback — log in immediately
      const loginRes = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!loginRes.ok) {
        router.push("/login?registered=1");
        return;
      }

      window.location.href = "/dashboard";
    } catch {
      setError("Something went wrong. Your account may have been created — try signing in.");
      setLoading(false);
    }
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
            <p className="text-slate-400 text-sm mt-1">The first user becomes Admin automatically</p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-white">Create Account</CardTitle>
            <CardDescription className="text-slate-400">Get your agency set up in seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Full Name</Label>
                <Input
                  value={name} onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Smith" required autoFocus
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.com" required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Password</Label>
                <Input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters" required minLength={8}
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                />
              </div>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Creating account…" : "Create Account"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-400">
              Already have an account?{" "}
              <Link href="/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
