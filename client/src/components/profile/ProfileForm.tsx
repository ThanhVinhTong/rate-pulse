"use client";

import { useActionState, useMemo } from "react";

import { updateProfileAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { FieldCaption, FieldLabel } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Text } from "@/components/ui/typography";
import type { AuthSession, CountryOption } from "@/types";

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
    return (byCode.countryCode ?? "").toLowerCase();
  }

  const byName = countries.find(
    (country) => country.countryName.toLowerCase() === normalized.toLowerCase(),
  );
  if (byName) {
    return (byName.countryCode ?? "").toLowerCase();
  }

  return normalized;
}

function normalizeTimeZone(value: string | undefined): string {
  const normalized = (value ?? "").trim().toLowerCase();

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

const timeZoneOptions = Array.from({ length: 27 }, (_, index) => {
  const offset = index - 12;
  const sign = offset >= 0 ? "+" : "-";
  const absolute = Math.abs(offset);
  const value = `utc${sign}${absolute}`;
  const label = `UTC${sign}${absolute}`;

  return { value, label };
});

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

  const timeZoneValue = useMemo(() => normalizeTimeZone(session.timeZone), [session.timeZone]);

  return (
    <form action={formAction} className="mt-8 grid gap-4 md:grid-cols-2">
      {/*First Name*/}
      <FieldLabel>
        <FieldCaption>First name</FieldCaption>
        <Input name="firstName" defaultValue={session.firstName} />
      </FieldLabel>

      {/*Last Name*/}
      <FieldLabel>
        <FieldCaption>Last name</FieldCaption>
        <Input name="lastName" defaultValue={session.lastName} />
      </FieldLabel>

      {/*Email Address*/}
      <FieldLabel className="md:col-span-2">
        <FieldCaption>Email address</FieldCaption>
        <div className="relative">
          <Input
            value={maskEmail(session.email)}
            readOnly
            disabled
            variant="ghostReadonly"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted/60">
            protected
          </span>
        </div>
      </FieldLabel>

      {/*Country of Residence*/}
      <FieldLabel>
        <FieldCaption>Country of Residence</FieldCaption>
        <Select name="countryOfResidence" defaultValue={residenceValue}>
          <option value="">Select country</option>
          {countries.map((country) => (
            <option
              key={`residence-${country.countryId}`}
              value={(country.countryCode ?? "").toLowerCase()}
            >
              {country.countryName}
            </option>
          ))}
        </Select>
      </FieldLabel>

      {/*Country of Birth*/}
      <FieldLabel>
        <FieldCaption>Country of Birth</FieldCaption>
        <Select name="countryOfBirth" defaultValue={birthValue}>
          <option value="">Select country</option>
          {countries.map((country) => (
            <option
              key={`birth-${country.countryId}`}
              value={(country.countryCode ?? "").toLowerCase()}
            >
              {country.countryName}
            </option>
          ))}
        </Select>
      </FieldLabel>

      {/*Time Zone*/}
      <FieldLabel>
        <FieldCaption>Time zone</FieldCaption>
        <Select name="timeZone" defaultValue={timeZoneValue}>
          {timeZoneOptions.map((timeZone) => (
            <option key={timeZone.value} value={timeZone.value}>
              {timeZone.label}
            </option>
          ))}
        </Select>
      </FieldLabel>

      {/*Submit Area*/}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between md:col-span-2">
        <div>
          {state.status === "success" ? (
            <Text className="text-sm text-status-success">{state.message}</Text>
          ) : null}
          {state.status === "error" ? (
            <Text className="text-sm text-status-danger">{state.message}</Text>
          ) : null}
        </div>
        <SubmitButton pendingLabel="Updating profile...">Save changes</SubmitButton>
      </div>
    </form>
  );
}
