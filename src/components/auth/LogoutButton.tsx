"use client";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  className?: string;
}

export default function LogoutButton({ children, className }: Props) {
  const router = useRouter();
  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={handleLogout}
      className={
        className ??
        "inline-flex items-center gap-1.5 rounded-md bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
      }
    >
      {children}
    </button>
  );
}
