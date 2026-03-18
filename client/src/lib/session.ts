import type { AuthSession } from "@/types";

const DEFAULT_SESSION_MAX_AGE = 60 * 60 * 24 * 7;

interface SessionEnvelope {
  session: AuthSession;
  expiresAt: number;
}

const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

function getSessionSecret() {
  return (
    process.env.AUTH_SECRET ??
    process.env.NEXTAUTH_SECRET ??
    "rate-pulse-local-dev-secret"
  );
}

function bytesToBase64Url(bytes: Uint8Array) {
  let binary = "";

  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });

  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value: string) {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }

  return bytes;
}

function encodePayload(envelope: SessionEnvelope) {
  return bytesToBase64Url(textEncoder.encode(JSON.stringify(envelope)));
}

function decodePayload(value: string) {
  try {
    const bytes = base64UrlToBytes(value);
    return JSON.parse(textDecoder.decode(bytes)) as SessionEnvelope;
  } catch {
    return null;
  }
}

async function createSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    textEncoder.encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
}

async function signValue(value: string) {
  const key = await createSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, textEncoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function createSessionCookieValue(
  session: AuthSession,
  maxAge = DEFAULT_SESSION_MAX_AGE,
) {
  const envelope: SessionEnvelope = {
    session,
    expiresAt: Date.now() + maxAge * 1000,
  };
  const payload = encodePayload(envelope);
  const signature = await signValue(payload);

  return `${payload}.${signature}`;
}

export async function readSessionCookieValue(value?: string | null) {
  if (!value) {
    return null;
  }

  const [payload, signature] = value.split(".");

  if (!payload || !signature) {
    return null;
  }

  const expectedSignature = await signValue(payload);

  if (signature !== expectedSignature) {
    return null;
  }

  const envelope = decodePayload(payload);

  if (!envelope || envelope.expiresAt <= Date.now()) {
    return null;
  }

  return envelope;
}

export const SESSION_MAX_AGE = DEFAULT_SESSION_MAX_AGE;
