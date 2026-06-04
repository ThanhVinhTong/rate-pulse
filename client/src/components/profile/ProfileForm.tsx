"use client";

import { useActionState, useState, useEffect } from "react";

import { useProfile } from "@/hooks/useProfile";
import { updateProfileAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import { FieldCaption, FieldLabel } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Text } from "@/components/ui/typography";
import type { AuthSession } from "@/types";
import { TimezoneSelect, LanguageSelect, CountrySelect } from "@/components/profile/ProfileSelectors";

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

  const { profile, updateProfile } = useProfile(session.profile);
  const [localTimezone, setLocalTimezone] = useState("");
  const [localLanguage, setLocalLanguage] = useState("");
  const [localCountryOfResidence, setLocalCountryOfResidence] = useState("");
  const [localCountryOfBirth, setLocalCountryOfBirth] = useState("");

  useEffect(() => {
    if (profile?.timeZone) {
      setLocalTimezone(profile.timeZone);
    }
    if (profile?.languagePref) {
      setLocalLanguage(profile.languagePref);
    }
    if (profile?.countryOfResidence) {
      setLocalCountryOfResidence(profile.countryOfResidence);
    }
    if (profile?.countryOfBirth) {
      setLocalCountryOfBirth(profile.countryOfBirth);
    }
  }, [profile]);

  useEffect(() => {
    if (state.status === "success") {
      updateProfile({
        ...profile,
        timeZone: localTimezone,
        languagePref: localLanguage,
        countryOfResidence: localCountryOfResidence,
        countryOfBirth: localCountryOfBirth,
      });
    }
  }, [state, localTimezone, localLanguage, localCountryOfResidence, localCountryOfBirth]);

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
        <FieldCaption>Time zone</FieldCaption>
        <TimezoneSelect
          name="timezone"
          defaultValue={profile?.timeZone || ""}
          onChange={setLocalTimezone}
        />
      </FieldLabel>

      <FieldLabel>
        <FieldCaption>Language Preference</FieldCaption>
        <LanguageSelect
          name="language"
          defaultValue={profile?.languagePref || ""}
          onChange={setLocalLanguage}
        />
      </FieldLabel>

      <FieldLabel>
        <FieldCaption>Country of Residence</FieldCaption>
        <CountrySelect
          name="countryOfResidence"
          defaultValue={profile?.countryOfResidence || ""}
          onChange={setLocalCountryOfResidence}
        />
      </FieldLabel>

      <FieldLabel>
        <FieldCaption>Country of Birth</FieldCaption>
        <CountrySelect
          name="countryOfBirth"
          defaultValue={profile?.countryOfBirth || ""}
          onChange={setLocalCountryOfBirth}
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
