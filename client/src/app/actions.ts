"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { clearSession, createSession, simulateAuth } from "@/lib/auth";
import type { ActionState } from "@/lib/action-state";

function buildDisplayName(name: FormDataEntryValue | null, fallbackEmail: string) {
  const value = typeof name === "string" ? name.trim() : "";

  if (value) {
    return value;
  }

  return fallbackEmail.split("@")[0] ?? "Trader";
}

export async function loginAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();

  if (!email || !password) {
    return {
      status: "error",
      message: "Email and password are required.",
    };
  }

  const session = simulateAuth(email, buildDisplayName(formData.get("name"), email));

  await createSession(session);

  redirect(session.role === "admin" ? "/admin" : "/profile");
}

export async function signupAction(_: ActionState, formData: FormData): Promise<ActionState> {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "").trim();
  const name = buildDisplayName(formData.get("name"), email);

  if (!name || !email || !password) {
    return {
      status: "error",
      message: "Name, email, and password are required.",
    };
  }

  await createSession({
    ...simulateAuth(email, name),
    role: "trader",
  });

  redirect("/profile");
}

export async function logoutAction() {
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
