import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE } from "@/lib/constants";
import type { AuthSession, SessionRole } from "@/types";

function decodeSession(value: string): AuthSession | null {
  try {
    const decoded = Buffer.from(value, "base64url").toString("utf8");
    const parsed = JSON.parse(decoded) as AuthSession;

    if (!parsed.email || !parsed.name || !parsed.role) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

function encodeSession(session: AuthSession) {
  return Buffer.from(JSON.stringify(session)).toString("base64url");
}

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

  if (!rawSession) {
    return null;
  }

  return decodeSession(rawSession);
}

export async function getUserFromCookie() {
  return getSession();
}

export async function createSession(session: AuthSession) {
  const cookieStore = await cookies();

  cookieStore.set(AUTH_COOKIE, encodeSession(session), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
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
