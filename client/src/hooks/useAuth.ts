"use client";

import { useMemo } from "react";

import type { AuthSession } from "@/types";

export function useAuth(session: AuthSession | null) {
  return useMemo(
    () => ({
      session,
      isAuthenticated: Boolean(session),
      isAdmin: session?.role === "admin",
    }),
    [session],
  );
}
