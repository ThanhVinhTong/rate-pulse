import type { Metadata } from "next";

import { SettingsAccordion } from "@/components/profile/SettingsAccordion";
import { settingsSections } from "@/lib/mock-data";

export const metadata: Metadata = {
  title: "Settings",
  description: "Security, notifications, privacy, and support settings.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
        <p className="text-sm uppercase tracking-[0.24em] text-accent">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Platform preferences</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          Configure account security, notifications, privacy choices, and support
          workflows with accessible accordion sections and form actions.
        </p>
      </section>

      <SettingsAccordion sections={settingsSections} />
    </div>
  );
}
