import type { Metadata } from "next";

import { SettingsAccordion } from "@/components/profile/SettingsAccordion";
const settingsSections = [
  {
    id: "security",
    title: "Security",
    description: "Security settings",
  },
];

export const metadata: Metadata = {
  title: "Settings",
  description: "Security, notifications, privacy, and support settings.",
};

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <section className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">Settings</p>
        <h1 className="mt-3 text-3xl font-semibold text-text-primary">Account settings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
          Configure security, notifications, and account preferences from one place.
        </p>
      </section>

      <SettingsAccordion sections={settingsSections} />
    </div>
  );
}
