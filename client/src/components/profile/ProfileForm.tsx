"use client";

import { useActionState, useMemo } from "react";

import { updateProfileAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import type { AuthSession, CountryOption } from "@/types";

import { SubmitButton } from "@/components/ui/SubmitButton";
import { Select } from "@/components/ui/Select";

interface ProfileFormProps {
  session: AuthSession;
  countries: CountryOption[];
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}•••••@${domain.slice(0, 2)}•••••`;
}

function resolveCountryValue(value: string | undefined, countries: CountryOption[]): string {
  const normalized = (value ?? "").trim();

  if (!normalized) {
    return "";
  }

  const byCode = countries.find(
    (country) => (country.countryCode ?? "").toUpperCase() === normalized.toUpperCase(),
  );
  if (byCode) {
    return byCode.countryCode ?? byCode.countryName;
  }

  const byName = countries.find(
    (country) => country.countryName.toLowerCase() === normalized.toLowerCase(),
  );
  if (byName) {
    return byName.countryCode ?? byName.countryName;
  }

  return normalized;
}

export function ProfileForm({ session, countries }: ProfileFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateProfileAction,
    initialActionState,
  );

  const residenceValue = useMemo(
    () => resolveCountryValue(session.countryOfResidence, countries),
    [session.countryOfResidence, countries],
  );

  const birthValue = useMemo(
    () => resolveCountryValue(session.countryOfBirth, countries),
    [session.countryOfBirth, countries],
  );

  return (
    <form action={formAction} className="mt-8 grid gap-4 md:grid-cols-2">
      <label className="space-y-2">
        <span className="text-sm text-text-muted">First name</span>
        <input
          name="firstName"
          defaultValue={session.firstName}
          className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
        />
      </label>

      <label className="space-y-2">
        <span className="text-sm text-text-muted">Last name</span>
        <input
          name="lastName"
          defaultValue={session.lastName}
          className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
        />
      </label>

      <label className="space-y-2 md:col-span-2">
        <span className="text-sm text-text-muted">Email address</span>
        <div className="relative">
          <input
            value={maskEmail(session.email)}
            readOnly
            disabled
            className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-text-muted outline-none cursor-not-allowed select-none"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted/60">
            protected
          </span>
        </div>
      </label>

      <label className="space-y-2">
        <span className="text-sm text-text-muted">Country of Residence</span>
        <Select name="countryOfResidence" defaultValue={residenceValue}>
          <option value="">Select country</option>
          {countries.map((country) => (
            <option
              key={`residence-${country.countryId}`}
              value={country.countryCode ?? country.countryName}
            >
              {country.countryName}
            </option>
          ))}
        </Select>
      </label>

      <label className="space-y-2">
        <span className="text-sm text-text-muted">Country of Birth</span>
        <Select name="countryOfBirth" defaultValue={birthValue}>
          <option value="">Select country</option>
          {countries.map((country) => (
            <option
              key={`birth-${country.countryId}`}
              value={country.countryCode ?? country.countryName}
            >
              {country.countryName}
            </option>
          ))}
        </Select>
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
