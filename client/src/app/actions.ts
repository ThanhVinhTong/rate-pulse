"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, createSession, getSession, getValidAccessToken } from "@/lib/auth";
import type { ApiCurrency, ApiCountry, ApiRateSource } from "@/lib/exchange-rate-mapper";
import { buildPairSnapshots, type ExchangeRateRowInput } from "@/lib/pair-snapshot";
import { fetchAllExchangeRates, fetchAllPages, fetchExchangeRateTypes } from "@/lib/server/exchange-rates";
import type { PairSnapshot } from "@/types";
import type { ActionState } from "@/lib/action-state";
import type { AuthSession } from "@/types";

const API_BASE_URL = "https://api.rate-pulse.me";

function normalizeUtcOffset(value: unknown): string {
  const normalized = String(value ?? "")
    .trim()
    .toLowerCase();

  if (normalized === "utc") {
    return "utc+0";
  }

  const match = normalized.match(/^utc([+-])(\d{1,2})$/);
  if (!match) {
    return "utc+0";
  }

  const sign = match[1];
  const offset = Number(match[2]);

  if (!Number.isInteger(offset) || offset < 0 || offset > 14) {
    return "utc+0";
  }

  return `utc${sign}${offset}`;
}

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
      userId: user.user_id,
      email: user.email,
      name: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
      timeZone: normalizeUtcOffset(user.time_zone),
      countryOfResidence: user.country_of_residence,
      countryOfBirth: user.country_of_birth,
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
  const username = firstName + lastName;
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
      userId: loginUser.user_id,
      email: loginUser.email,
      name: loginUser.username,
      firstName: loginUser.first_name,
      lastName: loginUser.last_name,
      timeZone: normalizeUtcOffset(loginUser.time_zone),
      countryOfResidence: loginUser.country_of_residence,
      countryOfBirth: loginUser.country_of_birth,
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
  const timeZone = normalizeUtcOffset(formData.get("timeZone"));
  const countryOfResidence = String(formData.get("countryOfResidence") ?? "")
    .trim()
    .toLowerCase();
  const countryOfBirth = String(formData.get("countryOfBirth") ?? "")
    .trim()
    .toLowerCase();

  if (!firstName || !lastName) {
    return {
      status: "error",
      message: "First and last name are required.",
    };
  }

  const session = await getSession();

  if (!session) {
    return {
      status: "error",
      message: "You must be signed in to update your profile.",
    };
  }

  if (typeof session.userId !== "number") {
    return {
      status: "error",
      message: "Unable to identify your account. Please sign in again.",
    };
  }

  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    return {
      status: "error",
      message: "Your session has expired. Please sign in again.",
    };
  }

  try {
    const res = await fetch(`${API_BASE_URL}/users/${session.userId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      body: JSON.stringify({
        first_name: firstName,
        last_name: lastName,
        time_zone: timeZone,
        country_of_residence: countryOfResidence,
        country_of_birth: countryOfBirth,
      }),
    });

    if (!res.ok) {
      const error = await res.json().catch(() => ({ error: "Profile update failed" }));
      return {
        status: "error",
        message: error.error || "Profile update failed. Please try again.",
      };
    }

    const data = await res.json();

    await createSession({
      ...session,
      firstName: typeof data.first_name === "string" ? data.first_name : firstName,
      lastName: typeof data.last_name === "string" ? data.last_name : lastName,
      timeZone: normalizeUtcOffset(data.time_zone ?? timeZone),
      countryOfResidence:
        typeof data.country_of_residence === "string"
          ? data.country_of_residence
          : countryOfResidence,
      countryOfBirth:
        typeof data.country_of_birth === "string" ? data.country_of_birth : countryOfBirth,
      name: typeof data.username === "string" ? data.username : session.name,
    });
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: "Profile updated successfully.",
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

export async function updateCurrencyPreferenceAction(
  _: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const currencyIdRaw = String(formData.get("primaryCurrencyId") ?? "").trim();
  const isPrimary = formData.get("isPrimary") === "on";

  if (!currencyIdRaw) {
    return {
      status: "error",
      message: "Choose your perfer currency.",
    };
  }

  const currencyId = Number(currencyIdRaw);
  if (!Number.isInteger(currencyId) || currencyId < 1) {
    return {
      status: "error",
      message: "Invalid currency selection.",
    };
  }

  const accessToken = await getValidAccessToken();

  if (!accessToken) {
    return {
      status: "error",
      message: "Your session has expired. Please sign in again.",
    };
  }

  const payload = {
    currency_id: currencyId,
    is_favorite: isPrimary,
  };

  try {
    const createRes = await fetch(`${API_BASE_URL}/currency-preference`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
      body: JSON.stringify(payload),
    });

    if (!createRes.ok) {
      const updateRes = await fetch(`${API_BASE_URL}/currency-preference/${currencyId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
        body: JSON.stringify(payload),
      });

      if (!updateRes.ok) {
        const error = await updateRes.json().catch(() => ({ error: "Unable to save currency preference" }));
        return {
          status: "error",
          message: error.error || "Unable to save currency preference.",
        };
      }
    }
  } catch (err) {
    return {
      status: "error",
      message: err instanceof Error ? err.message : String(err),
    };
  }

  revalidatePath("/profile");

  return {
    status: "success",
    message: isPrimary
      ? "Currency preference saved as base currency."
      : "Currency preference saved as target currency.",
  };
}

interface UserCurrencyPreference {
  CurrencyID?: number;
  currency_id?: number;
  IsFavorite?: boolean | null | { Bool?: boolean; Valid?: boolean; bool?: boolean; valid?: boolean };
  is_favorite?: boolean | null | { Bool?: boolean; Valid?: boolean; bool?: boolean; valid?: boolean };
}

function parseNullableBool(
  value: UserCurrencyPreference["IsFavorite"] | UserCurrencyPreference["is_favorite"],
): boolean | null {
  if (typeof value === "boolean") {
    return value;
  }

  if (value && typeof value === "object") {
    const valid = "Valid" in value ? value.Valid : value.valid;
    const boolValue = "Bool" in value ? value.Bool : value.bool;
    if (valid === true && typeof boolValue === "boolean") {
      return boolValue;
    }
  }

  return null;
}

export interface UserCurrencyPreferencesMap {
  base?: number | null; // currency_id marked as base (is_favorite = true)
  target?: number | null; // currency_id marked as target (is_favorite = false)
  all: Array<{ currencyId: number; isFavorite: boolean | null }>;
}

export async function getAllUserCurrencyPreferences(
  accessToken: string,
): Promise<UserCurrencyPreferencesMap> {
  const preferences: Array<{ currencyId: number; isFavorite: boolean | null }> = [];
  let baseCurrencyId: number | null = null;
  let targetCurrencyId: number | null = null;

  const pageSize = 10;

  try {
    for (let pageId = 1; pageId <= 100; pageId += 1) {
      const response = await fetch(
        `${API_BASE_URL}/currency-preference-userid?page_id=${pageId}&page_size=${pageSize}`,
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        },
      );

      if (!response.ok) {
        break;
      }

      const data = (await response.json()) as UserCurrencyPreference[];

      if (!Array.isArray(data) || data.length === 0) {
        break;
      }

      for (const item of data) {
        const currencyId = typeof item.CurrencyID === "number" ? item.CurrencyID : item.currency_id;
        const isFavorite = parseNullableBool(item.IsFavorite ?? item.is_favorite ?? null);

        if (typeof currencyId === "number" && currencyId > 0) {
          preferences.push({
            currencyId,
            isFavorite,
          });

          // Track the first base (is_favorite = true) and first target (is_favorite = false)
          if (isFavorite === true && baseCurrencyId === null) {
            baseCurrencyId = currencyId;
          } else if (isFavorite === false && targetCurrencyId === null) {
            targetCurrencyId = currencyId;
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to fetch user currency preferences:", err);
  }

  return {
    base: baseCurrencyId,
    target: targetCurrencyId,
    all: preferences,
  };
}

export async function refreshExchangeRatesAction(): Promise<ActionState & { data?: PairSnapshot[] }> {
  try {
    const [currencies, countries, sources, ratesRaw, typesFromApi] = await Promise.all([
      fetchAllPages<ApiCurrency>("/currencies"),
      fetchAllPages<ApiCountry>("/countries"),
      fetchAllPages<ApiRateSource>("/rate-sources"),
      fetchAllExchangeRates(),
      fetchExchangeRateTypes(),
    ]);

    const rates: ExchangeRateRowInput[] = ratesRaw.map((rate) => ({
      rate_id: rate.rate_id,
      rate_value: rate.rate_value,
      source_currency_id: rate.source_currency_id,
      destination_currency_id: rate.destination_currency_id,
      source_id: rate.source_id,
      type_id: rate.type_id,
      valid_from_date: rate.valid_from_date,
    }));

    const pairSnapshots = buildPairSnapshots(currencies, countries, sources, rates, typesFromApi);

    return {
      status: "success",
      message: "Exchange rates refreshed successfully.",
      data: pairSnapshots,
    };
  } catch (error) {
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Failed to refresh exchange rates.",
    };
  }
}
