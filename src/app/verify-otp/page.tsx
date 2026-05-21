"use client";
import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

function VerifyOtpForm() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") ?? "";

  const [digits, setDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  useEffect(() => {
    inputs.current[0]?.focus();
  }, []);

  function handleChange(i: number, val: string) {
    const v = val.replace(/\D/g, "").slice(0, 1);
    const next = [...digits];
    next[i] = v;
    setDigits(next);
    if (v && i < 5) inputs.current[i + 1]?.focus();
  }

  function handleKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (text.length === 0) return;
    e.preventDefault();
    const next = ["", "", "", "", "", ""];
    for (let i = 0; i < text.length; i++) next[i] = text[i];
    setDigits(next);
    const lastIdx = Math.min(text.length, 5);
    inputs.current[lastIdx]?.focus();
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Enter all 6 digits.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, code }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Verification failed.");
        setLoading(false);
        return;
      }
      window.location.href = data.role === "CLIENT_USER" ? "/portal" : "/dashboard";
    } catch {
      setError("Verification failed. Please try again.");
      setLoading(false);
    }
  }

  async function resend() {
    setResending(true);
    setError("");
    setInfo("");
    try {
      const res = await fetch("/api/otp/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setInfo("A new code has been sent.");
      else setError("Could not resend code.");
    } catch {
      setError("Could not resend code.");
    } finally {
      setResending(false);
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
            <CardTitle className="text-white">Verify your email</CardTitle>
            <CardDescription className="text-slate-400">
              Enter the 6-digit code we sent to <span className="text-slate-200">{email || "your email"}</span>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5">
              <div className="flex justify-between gap-2">
                {digits.map((d, i) => (
                  <input
                    key={i}
                    ref={(el) => { inputs.current[i] = el; }}
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={(e) => handleChange(i, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(i, e)}
                    onPaste={handlePaste}
                    className="h-12 w-12 rounded-lg bg-slate-700 border border-slate-600 text-white text-center text-xl font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                ))}
              </div>
              {info && <p className="text-sm text-emerald-400">{info}</p>}
              {error && <p className="text-sm text-red-400">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Verifying…" : "Verify"}
              </Button>
            </form>
            <p className="mt-4 text-center text-sm text-slate-400">
              Didn&apos;t get a code?{" "}
              <button
                type="button"
                onClick={resend}
                disabled={resending || !email}
                className="text-indigo-400 hover:text-indigo-300 font-medium disabled:opacity-50"
              >
                {resending ? "Sending…" : "Resend code"}
              </button>
            </p>
            <p className="mt-2 text-center text-xs text-slate-500">
              <Link href="/login" className="hover:text-slate-300">Back to sign in</Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
