"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, createSession, getSession } from "@/lib/auth";
import { mapApiBankRates, type ApiCurrency, type ApiCountry, type ApiRateSource, type ApiExchangeRate } from "@/lib/exchange-rate-mapper";
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
      const error = await res.json().catch(() => ({ error: "Login failed" }));
      return {
        status: "error",
        message: error.error || "Login failed. Please check your credentials.",
      };
    }

    const data = await res.json();
    const user = data.user ?? data;
    const userType = user.user_type ?? "free";

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
  let redirectTo = "/profile";

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
      const error = await res.json().catch(() => ({ error: "Signup failed" }));
      return {
        status: "error",
        message: error.error || "Signup failed. Please try again.",
      };
    }

    await res.json();

    // After signup, login the user
    const loginRes = await fetch(`${API_BASE_URL}/users/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
      }),
    });

    if (!loginRes.ok) {
      return {
        status: "error",
        message: "Account created but login failed. Please try logging in.",
      };
    }

    const loginData = await loginRes.json();
    const loginUser = loginData.user ?? loginData;
    const loginUserType = loginUser.user_type ?? "free";

    const session: AuthSession = {
      email: loginUser.email,
      name: loginUser.username,
      firstName: loginUser.first_name,
      lastName: loginUser.last_name,
      role: toSessionRole(loginUserType),
      sessionId: loginData.session_id,
      accessToken: loginData.access_token,
      accessTokenExpiresAt: loginData.access_token_expires_at,
      refreshToken: loginData.refresh_token,
      refreshTokenExpiresAt: loginData.refresh_token_expires_at,
    };

    await createSession(session);
    redirectTo = "/profile";
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  redirect(redirectTo);
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
    message: "Profile preferences updated for this demo workspace.",
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

export async function refreshExchangeRatesAction(): Promise<ActionState & { data?: any }> {
  try {
    const token = await getSession().then((session) => session?.accessToken);
    
    if (!token) {
      return {
        status: "error",
        message: "Authentication required to refresh rates.",
      };
    }

    const PAGE_SIZE = 10;

    async function fetchAllPages<T>(path: string): Promise<T[]> {
      const items: T[] = [];
      for (let page = 1; page <= 100; page += 1) {
        const res = await fetch(`${API_BASE_URL}${path}?page_id=${page}&page_size=${PAGE_SIZE}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        if (!res.ok) {
          throw new Error(`Failed to fetch ${path}: ${res.status}`);
        }

        const pageItems = (await res.json()) as T[];
        items.push(...pageItems);

        if (pageItems.length < PAGE_SIZE) {
          break;
        }
      }
      return items;
    }

    const [currencies, countries, sources, rates] = await Promise.all([
      fetchAllPages<ApiCurrency>("/currencies"),
      fetchAllPages<ApiCountry>("/countries"),
      fetchAllPages<ApiRateSource>("/rate-sources"),
      fetchAllPages<ApiExchangeRate>("/exchange-rates"),
    ]);

    const bankRates = mapApiBankRates(currencies, countries, sources, rates);

    return {
      status: "success",
      message: "Exchange rates refreshed successfully.",
      data: bankRates,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to refresh exchange rates.",
    };
  }
}
