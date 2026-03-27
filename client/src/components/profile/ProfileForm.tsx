"use client";

import { useActionState } from "react";

import { updateProfileAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { FieldCaption, FieldLabel } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/Select";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Textarea } from "@/components/ui/textarea";
import { Text } from "@/components/ui/typography";
import type { AuthSession } from "@/types";

interface ProfileFormProps {
  session: AuthSession;
}

function maskEmail(email: string): string {
  const [local, domain] = email.split("@");
  if (!local || !domain) return email;
  return `${local.slice(0, 2)}•••••@${domain.slice(0, 2)}•••••`;
}

export function ProfileForm({ session }: ProfileFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateProfileAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="mt-8 grid gap-4 md:grid-cols-2">
      <FieldLabel>
        <FieldCaption>First name</FieldCaption>
        <Input name="firstName" defaultValue={session.firstName} />
      </FieldLabel>

      <FieldLabel>
        <FieldCaption>Last name</FieldCaption>
        <Input name="lastName" defaultValue={session.lastName} />
      </FieldLabel>

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

      <FieldLabel>
        <FieldCaption>Base currency</FieldCaption>
        <Select name="currency" defaultValue="USD">
          <option>USD</option>
          <option>EUR</option>
          <option>GBP</option>
          <option>JPY</option>
        </Select>
      </FieldLabel>

      <FieldLabel>
        <FieldCaption>Risk profile</FieldCaption>
        <Select name="riskProfile" defaultValue="Balanced">
          <option>Conservative</option>
          <option>Balanced</option>
          <option>Growth</option>
          <option>Aggressive</option>
        </Select>
      </FieldLabel>

      <FieldLabel className="md:col-span-2">
        <FieldCaption>Notes</FieldCaption>
        <Textarea
          name="notes"
          rows={4}
          defaultValue="Prefers London and New York session summaries with risk reminders."
        />
      </FieldLabel>

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
