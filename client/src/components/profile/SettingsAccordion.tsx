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
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
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
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {section.title}
              </button>
            );
          })}
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">{activeSection.title}</p>
          <h1 className="mt-3 text-2xl font-semibold text-white">Settings workspace</h1>
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
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm text-text-muted">Secondary option</span>
                <input
                  name={`${activeSection.id}-secondary`}
                  defaultValue="Review weekly"
                  className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
                />
              </label>
              <label className="space-y-2 md:col-span-2">
                <span className="text-sm text-text-muted">Configuration notes</span>
                <textarea
                  name={`${activeSection.id}-notes`}
                  rows={4}
                  defaultValue={`Rate-pulse mock configuration for ${activeSection.title.toLowerCase()}.`}
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
                <SubmitButton pendingLabel="Saving section...">Save section</SubmitButton>
              </div>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
