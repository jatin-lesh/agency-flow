"use client";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";
import type { AppSession } from "@/lib/session";

type Status = "loading" | "authenticated" | "unauthenticated";

type SessionContextValue = {
  data: AppSession | null;
  status: Status;
  refresh: () => void;
};

const SessionContext = createContext<SessionContextValue>({
  data: null,
  status: "loading",
  refresh: () => {},
});

export function SessionProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<AppSession | null>(null);
  const [status, setStatus] = useState<Status>("loading");

  const refresh = useCallback(() => {
    setStatus("loading");
    fetch("/api/auth/session")
      .then((r) => (r.ok ? r.json() : null))
      .then((session: AppSession | null) => {
        setData(session);
        setStatus(session ? "authenticated" : "unauthenticated");
      })
      .catch(() => {
        setData(null);
        setStatus("unauthenticated");
      });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ data, status, refresh }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
