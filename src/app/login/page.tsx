"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (searchParams.get("registered") === "1") {
      setInfo("Account created! Please sign in.");
    }
  }, [searchParams]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setInfo("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        setError("Invalid email or password.");
        setLoading(false);
        return;
      }

      const data = await res.json().catch(() => ({}));
      // Hard navigation so SessionProvider re-mounts and fetches the new cookie
      window.location.href = data.role === "CLIENT_USER" ? "/portal" : "/dashboard";
    } catch {
      setLoading(false);
      setError("Sign in failed. Please try again.");
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
            <p className="text-slate-400 text-sm mt-1">Your agency. Your space.</p>
          </div>
        </div>

        <Card className="border-slate-700 bg-slate-800/80 backdrop-blur">
          <CardHeader className="pb-4">
            <CardTitle className="text-white">Sign In</CardTitle>
            <CardDescription className="text-slate-400">Enter your credentials to continue</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-4">
              <div className="space-y-1.5">
                <Label className="text-slate-300">Email</Label>
                <Input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@agency.com" required autoFocus
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-300">Password</Label>
                <Input
                  type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" required
                  className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-500 focus-visible:ring-indigo-500"
                />
              </div>
              {info  && <p className="text-sm text-emerald-400">{info}</p>}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Signing in…" : "Sign In"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-400">
              No account?{" "}
              <Link href="/register" className="text-indigo-400 hover:text-indigo-300 font-medium">
                Create one
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
