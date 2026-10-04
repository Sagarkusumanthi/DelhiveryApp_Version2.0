"use client";
import { useEffect, useState } from "react";
import type { SessionPayload } from "@/lib/jwt";

export function useSession() {
  const [session, setSession] = useState<SessionPayload | null | undefined>(undefined); // undefined = loading
  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.json())
      .then((d) => setSession(d.session))
      .catch(() => setSession(null));
  }, []);
  return session;
}
