import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE } from "@/lib/constants";
import { createSessionCookieValue, readSessionCookieValue, SESSION_MAX_AGE } from "@/lib/session";
import type { AuthSession, SessionRole } from "@/types";

export function simulateAuth(email: string, name?: string): AuthSession {
  const normalizedEmail = email.trim().toLowerCase();
  const role: SessionRole = normalizedEmail.includes("admin") ? "admin" : "trader";

  return {
    email: normalizedEmail,
    name: name?.trim() || normalizedEmail.split("@")[0] || "Trader",
    role,
  };
}

export async function getSession() {
  const cookieStore = await cookies();
  const rawSession = cookieStore.get(AUTH_COOKIE)?.value;

  const envelope = await readSessionCookieValue(rawSession);

  if (!envelope) {
    return null;
  }

  return envelope.session;
}

export async function getUserFromCookie() {
  return getSession();
}

export async function createSession(session: AuthSession) {
  const cookieStore = await cookies();
  const value = await createSessionCookieValue(session);

  cookieStore.set(AUTH_COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(AUTH_COOKIE);
}

export async function requireAuth() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  return session;
}

export async function requireAdmin() {
  const session = await requireAuth();

  if (session.role !== "admin") {
    redirect("/analytics");
  }

  return session;
}
