"use client";

import { Bell, Lock, Shield } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import { updateSettingsAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import type { SettingsSection } from "@/types";

import { SubmitButton } from "@/components/ui/SubmitButton";
import { LocalizationForm } from "./LocalizationForm";
import { Notification } from "./Notification";
import { SecuritySettings } from "./SecuritySettings";

interface SettingsAccordionProps {
  sections: SettingsSection[];
}

const sectionIcons: Record<string, LucideIcon> = {
  security: Shield,
  notifications: Bell,
  privacy: Lock,
};

export function SettingsAccordion({ sections }: SettingsAccordionProps) {
  const [activeSectionId, setActiveSectionId] = useState(sections[0]?.id ?? "");
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateSettingsAction,
    initialActionState,
  );

  const activeSection = useMemo(
    () => sections.find((section) => section.id === activeSectionId) ?? sections[0],
    [activeSectionId, sections],
  );

  if (!activeSection) {
    return null;
  }

  return (
    <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {sections.map((section) => {
            const Icon = sectionIcons[section.id] ?? Shield;
            const active = activeSection.id === section.id;

            return (
              <button
                key={section.id}
                type="button"
                onClick={() => setActiveSectionId(section.id)}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  active
                    ? "bg-primary text-text-primary"
                    : "text-text-muted hover:bg-panel hover:text-text-primary"
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.title}
              </button>
            );
          })}
        </div>

        <div>
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">{activeSection.title}</p>
          <h1 className="mt-3 text-2xl font-semibold text-text-primary">Account settings</h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
            {activeSection.description}
          </p>
          {activeSection.id === "security" ? (
            <SecuritySettings />
          ) : activeSection.id === "notifications" ? (
            <Notification />
          ) : activeSection.id === "privacy" ? (
            <LocalizationForm />
          ) : (
            <form action={formAction} className="mt-8 grid gap-4 md:grid-cols-2">
              <input type="hidden" name="section" value={activeSection.title} />
              <label className="space-y-2">
                <span className="text-sm text-text-muted">Primary option</span>
                <input
                  name={`${activeSection.id}-primary`}
                  defaultValue="Enabled"
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-text-primary shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-text-muted">Secondary option</span>
                <input
                  name={`${activeSection.id}-secondary`}
                  defaultValue="Review weekly"
                  className="h-10 w-full rounded-md border border-border bg-card px-3 text-sm text-text-primary shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm text-text-muted">Configuration notes</span>
                <textarea
                  name={`${activeSection.id}-notes`}
                  rows={4}
                  defaultValue={`Rate-pulse mock configuration for ${activeSection.title.toLowerCase()}.`}
                  className="w-full rounded-md border border-border bg-card px-3 py-2 text-sm text-text-primary shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/15"
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
                <SubmitButton pendingLabel="Saving section...">Save section</SubmitButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
