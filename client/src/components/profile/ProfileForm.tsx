"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import type { AuthSession } from "@/types";

import { SubmitButton } from "@/components/common/SubmitButton";

interface ProfileFormProps {
  session: AuthSession;
}

export function ProfileForm({ session }: ProfileFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateProfileAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-4 md:grid-cols-2">
      <label className="space-y-2">
        <span className="text-sm text-text-muted">First name</span>
        <input
          name="firstName"
          defaultValue={session.name.split(" ")[0]}
          className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm text-text-muted">Last name</span>
        <input
          name="lastName"
          defaultValue={session.name.split(" ").slice(1).join(" ") || "Trader"}
          className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
        />
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm text-text-muted">Email address</span>
        <input
          name="email"
          defaultValue={session.email}
          className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm text-text-muted">Base currency</span>
        <select
          name="currency"
          defaultValue="USD"
          className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
        >
          <option>USD</option>
          <option>EUR</option>
          <option>GBP</option>
          <option>JPY</option>
        </select>
      </label>

      <label className="space-y-2">
        <span className="text-sm text-text-muted">Risk profile</span>
        <select
          name="riskProfile"
          defaultValue="Balanced"
          className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
        >
          <option>Conservative</option>
          <option>Balanced</option>
          <option>Growth</option>
          <option>Aggressive</option>
        </select>
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm text-text-muted">Notes</span>
        <textarea
          name="notes"
          rows={4}
          defaultValue="Prefers London and New York session summaries with risk reminders."
          className="w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 py-3 text-white outline-none transition focus:border-primary"
        />
      </label>

      <div className="md:col-span-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {state.status === "success" ? (
            <p className="text-sm text-status-success">{state.message}</p>
          ) : null}
          {state.status === "error" ? (
            <p className="text-sm text-status-danger">{state.message}</p>
          ) : null}
        </div>
        <SubmitButton pendingLabel="Updating profile...">Save changes</SubmitButton>
      </div>
    </form>
  );
}
