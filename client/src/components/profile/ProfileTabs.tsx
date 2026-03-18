"use client";

import { Bell, Shield, UserRound } from "lucide-react";
import { useMemo, useState } from "react";

import type { AuthSession } from "@/types";

import { ProfileForm } from "./ProfileForm";
import { PreferencesForm } from "./PreferencesForm";
import { SecurityForm } from "./SecurityForm";

const tabs = [
  {
    id: "personal",
    label: "Personal Information",
    title: "Profile workspace",
    icon: UserRound,
  },
  {
    id: "preferences",
    label: "Preferences",
    title: "Platform Preferences",
    icon: Bell,
  },
  {
    id: "security",
    label: "Account Security",
    title: "Security Settings",
    icon: Shield,
  },
] as const;

interface ProfileTabsProps {
  session: AuthSession;
}

export function ProfileTabs({ session }: ProfileTabsProps) {
  const [activeTab, setActiveTab] = useState<(typeof tabs)[number]["id"]>("personal");

  const tabCopy = useMemo(
    () => ({
      personal: "Update your contact information and keep your trading identity current.",
      preferences: "Fine tune summaries, watchlists, and market digest delivery windows.",
      security: "Review access controls and reinforce account protection settings.",
    }),
    [],
  );

  return (
    <section className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <div className="space-y-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm transition ${
                  active
                    ? "bg-primary text-white"
                    : "text-text-muted hover:bg-white/5 hover:text-white"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        <div>
          <p className="text-sm uppercase tracking-[0.24em] text-accent">
            {tabs.find((tab) => tab.id === activeTab)?.label}
          </p>
          <h1 className="mt-3 text-2xl font-semibold text-white">
            {tabs.find((tab) => tab.id === activeTab)?.title}
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-text-muted">
            {tabCopy[activeTab]}
          </p>
          {activeTab === "personal" && <ProfileForm session={session} />}
          {activeTab === "preferences" && <PreferencesForm />}
          {activeTab === "security" && <SecurityForm session={session} />}
        </div>
      </div>
    </section>
  );
}
