import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { AUTH_COOKIE } from "@/lib/constants";
import { createSessionCookieValue, readSessionCookieValue, SESSION_MAX_AGE } from "@/lib/session";
import type { AuthSession } from "@/types";

const API_BASE_URL = "https://api.rate-pulse.me";
const ACCESS_TOKEN_SKEW_MS = 30_000;

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

function toTimestamp(value?: string) {
  if (!value) {
    return null;
  }

  const timestamp = Date.parse(value);
  return Number.isNaN(timestamp) ? null : timestamp;
}

function isExpired(value?: string, skewMs = 0) {
  const timestamp = toTimestamp(value);

  if (!timestamp) {
    return true;
  }

  return Date.now() + skewMs >= timestamp;
}

export async function getValidAccessToken() {
  const session = await getSession();

  if (!session) {
    return null;
  }

  if (session.accessToken && !isExpired(session.accessTokenExpiresAt, ACCESS_TOKEN_SKEW_MS)) {
    return session.accessToken;
  }

  if (!session.refreshToken || isExpired(session.refreshTokenExpiresAt)) {
    await clearSession();
    return null;
  }

  const response = await fetch(`${API_BASE_URL}/users/renew-access-token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
    body: JSON.stringify({
      refresh_token: session.refreshToken,
    }),
  });

  if (!response.ok) {
    await clearSession();
    return null;
  }

  const data = await response.json();

  if (typeof data.access_token !== "string" || typeof data.access_token_expires_at !== "string") {
    await clearSession();
    return null;
  }

  const updatedSession: AuthSession = {
    ...session,
    accessToken: data.access_token,
    accessTokenExpiresAt: data.access_token_expires_at,
  };

  await createSession(updatedSession);

  return updatedSession.accessToken;
}
