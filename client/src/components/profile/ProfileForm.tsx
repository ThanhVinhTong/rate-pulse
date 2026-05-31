"use client";

import { useActionState, useState, useRef, useEffect } from "react";
import { Search } from "lucide-react";

import { useTimezones } from "@/hooks/useTimezones";
import { useProfile } from "@/hooks/useProfile";
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

interface TimezoneSelectProps {
  name: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
}

export function TimezoneSelect({ name, defaultValue = "", onChange }: TimezoneSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    searchQuery,
    setSearchQuery,
    filteredTimezones,
    selectedTimezone,
    setSelectedTimezone,
  } = useTimezones(defaultValue);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    if (defaultValue) {
      setSelectedTimezone(defaultValue);
    }
  }, [defaultValue, setSelectedTimezone]);

  const handleSelect = (tz: string) => {
    setSelectedTimezone(tz);
    setIsOpen(false);
    if (onChange) {
      onChange(tz);
    }
  };

  return (
    <div ref={containerRef} className="relative w-full">
      <input type="hidden" name={name} value={selectedTimezone} />

      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(!isOpen)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
        className="flex h-10 w-full cursor-pointer items-center justify-between rounded-md border border-border bg-card px-3 text-sm text-text-primary shadow-sm transition hover:border-primary/60"
      >
        <span className="truncate">{selectedTimezone || "-- None --"}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          height="1em"
          viewBox="0 0 512 512"
          className={`h-4 w-4 fill-text-tertiary transition-transform duration-300 ${isOpen ? "rotate-180" : "rotate-0"}`}
        >
          <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z" />
        </svg>
      </div>

      {isOpen && (
        <div className="absolute left-0 top-[calc(100%+8px)] z-50 w-full rounded-md border border-border bg-card p-2 shadow-lg transition-all duration-300">
          <div className="relative mb-2">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-muted" />
            <input
              type="text"
              placeholder="Search time zones..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-border bg-surface px-8 py-1.5 text-xs text-text-primary placeholder:text-text-muted transition-colors focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5">
            <div
              role="button"
              tabIndex={0}
              onClick={() => handleSelect("")}
              className="cursor-pointer rounded-md px-3 py-1.5 text-xs text-text-muted transition-colors hover:bg-panel"
            >
              -- None --
            </div>
            {filteredTimezones.map((tz) => (
              <div
                key={tz}
                role="button"
                tabIndex={0}
                onClick={() => handleSelect(tz)}
                className={`cursor-pointer rounded-md px-3 py-1.5 text-xs transition-colors hover:bg-panel ${
                  selectedTimezone === tz ? "bg-panel font-semibold text-primary" : "text-text-primary"
                }`}
              >
                {tz}
              </div>
            ))}
            {filteredTimezones.length === 0 && (
              <div className="px-3 py-2 text-xs text-text-muted text-center">
                No matching time zones
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ProfileForm({ session }: ProfileFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateProfileAction,
    initialActionState,
  );

  const { profile, updateProfile } = useProfile(session.profile);
  const [localTimezone, setLocalTimezone] = useState("");

  useEffect(() => {
    if (profile?.timeZone) {
      setLocalTimezone(profile.timeZone);
    }
  }, [profile]);

  useEffect(() => {
    if (state.status === "success") {
      updateProfile({
        ...profile,
        timeZone: localTimezone,
      });
    }
  }, [state, localTimezone]);

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
