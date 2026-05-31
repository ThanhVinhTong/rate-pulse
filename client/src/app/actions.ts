"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, createSession, getSession } from "@/lib/auth";
import type { ApiCurrency, ApiCountry, ApiRateSource } from "@/lib/exchange-rate-mapper";
import { buildPairSnapshots, type ExchangeRateRowInput } from "@/lib/pair-snapshot";
import type { PairSnapshot, Profile } from "@/types";
import type { ActionState } from "@/lib/action-state";
import type { AuthSession } from "@/types";

const API_BASE_URL = "https://api.rate-pulse.me";

function toSessionRole(userType: string): AuthSession["role"] {
  switch (userType) {
    case "admin":
    case "premium":
    case "enterprise":
    case "free":
      return userType;
    default:
      return "free";
  }
}

function readApiErrorMessage(error: unknown, fallback: string) {
  if (error && typeof error === "object") {
    if ("message" in error && typeof error.message === "string") {
      return error.message;
    }

    if ("error" in error && typeof error.error === "string") {
      return error.error;
    }
  }

  return fallback;
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  let redirectTo = "/profile";

  if (!email || !password) {
    return {
      status: "error",
      message: "Email and password are required.",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/users/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      return {
        status: "error",
        message: readApiErrorMessage(error, "Login failed. Please check your credentials."),
      };
    }

    const data = await res.json();
    const user = data.user ?? data;
    const userType = user.user_type ?? "free";

    const profile: Profile = {
      timeZone: user.time_zone,
      languagePref: user.language_preference,
      countryOfResidence: user.country_of_residence,
      countryOfBirth: user.country_of_birth,
    };

    const session: AuthSession = {
      email: user.email,
      name: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      role: toSessionRole(userType),
      sessionId: data.session_id,
      accessToken: data.access_token,
      accessTokenExpiresAt: data.access_token_expires_at,
      refreshToken: data.refresh_token,
      refreshTokenExpiresAt: data.refresh_token_expires_at,
      profile,
    };

    await createSession(session);
    redirectTo = session.role === "admin" ? "/admin" : "/profile";
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  redirect(redirectTo);
}

export async function signupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const firstName = String(formData.get("first_name") ?? "").trim();
  const lastName = String(formData.get("last_name") ?? "").trim();
  const username = email.includes("@") ? (email.split("@")[0] ?? "") : email;

  if (!firstName || !lastName || !email || !password) {
    return {
      status: "error",
      message: "First name, last name, email, and password are required.",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/users/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username,
        email,
        password,
        first_name: firstName,
        last_name: lastName,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => null);
      return {
        status: "error",
        message: readApiErrorMessage(error, "Signup failed. Please try again."),
      };
    }

    await res.json();
    return {
      status: "success",
      message: `We are sending your verification email now. 
      It may take several minutes to arrive because email delivery is handled asynchronously. 
      Please check your inbox and spam folder before signing in.`,
    };
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function logoutAction() {
  const session = await getSession();

  if (session?.refreshToken) {
    await fetch(`${API_BASE_URL}/users/signout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        refresh_token: session.refreshToken,
      }),
      cache: "no-store",
    }).catch(() => undefined);
  }

  await clearSession();
  redirect("/");
}

export async function updateProfileAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const firstName = String(formData.get("firstName") ?? "").trim();
  const lastName = String(formData.get("lastName") ?? "").trim();

  if (!firstName || !lastName) {
    return {
      status: "error",
      message: "First and last name are required.",
    };
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: "Profile preferences updated successfully.",
  };
}

export async function updateSettingsAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const section = String(formData.get("section") ?? "").trim();

  if (!section) {
    return {
      status: "error",
      message: "Choose a settings section to update.",
    };
  }

  revalidatePath("/settings");

  return {
    status: "success",
    message: `${section} settings saved successfully.`,
  };
}
