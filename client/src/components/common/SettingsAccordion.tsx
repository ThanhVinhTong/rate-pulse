"use client";

import { ChevronDown } from "lucide-react";
import { useActionState, useState } from "react";

import { updateSettingsAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";
import type { SettingsSection } from "@/types";

import { SubmitButton } from "./SubmitButton";

interface SettingsAccordionProps {
  sections: SettingsSection[];
}

export function SettingsAccordion({ sections }: SettingsAccordionProps) {
  const [openSection, setOpenSection] = useState(sections[0]?.id ?? "");
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateSettingsAction,
    initialActionState,
  );

  return (
    <div className="space-y-4">
      {sections.map((section) => {
        const open = openSection === section.id;

        return (
          <div
            key={section.id}
            className="overflow-hidden rounded-2xl border border-white/10 bg-white/5"
          >
            <button
              type="button"
              onClick={() => setOpenSection(open ? "" : section.id)}
              className="flex min-h-14 w-full items-center justify-between gap-3 px-5 py-4 text-left"
            >
              <div>
                <h2 className="text-lg font-semibold text-white">{section.title}</h2>
                <p className="mt-1 text-sm text-text-muted">{section.description}</p>
              </div>
              <ChevronDown
                className={`h-5 w-5 text-text-muted transition ${open ? "rotate-180" : ""}`}
              />
            </button>

            {open ? (
              <form action={formAction} className="border-t border-white/10 px-5 py-5">
                <input type="hidden" name="section" value={section.title} />
                <div className="grid gap-4 md:grid-cols-2">
                  <label className="space-y-2">
                    <span className="text-sm text-text-muted">Primary option</span>
                    <input
                      name={`${section.id}-primary`}
                      defaultValue="Enabled"
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
                    />
                  </label>
                  <label className="space-y-2">
                    <span className="text-sm text-text-muted">Secondary option</span>
                    <input
                      name={`${section.id}-secondary`}
                      defaultValue="Review weekly"
                      className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition focus:border-primary"
                    />
                  </label>
                  <label className="space-y-2 md:col-span-2">
                    <span className="text-sm text-text-muted">Configuration notes</span>
                    <textarea
                      name={`${section.id}-notes`}
                      rows={4}
                      defaultValue={`Rate-pulse mock configuration for ${section.title.toLowerCase()}.`}
                      className="w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 py-3 text-white outline-none transition focus:border-primary"
                    />
                  </label>
                </div>
                <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
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
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
