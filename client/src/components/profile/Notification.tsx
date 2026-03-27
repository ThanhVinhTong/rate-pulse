"use client";

import { Bell, DollarSign, Globe, Mail } from "lucide-react";
import { useActionState } from "react";

import { updateSettingsAction } from "@/app/actions";
import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";

import { SettingToggle } from "@/components/ui/SettingToggle";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Text } from "@/components/ui/typography";

const notifications = [
  {
    id: "email",
    title: "Email Notifications",
    description: "Receive updates via email",
    icon: Mail,
    defaultChecked: true,
  },
  {
    id: "push",
    title: "Push Notifications",
    description: "Receive push notifications",
    icon: Bell,
    defaultChecked: false,
  },
  {
    id: "transaction",
    title: "Transaction Alerts",
    description: "Get notified of all transactions",
    icon: DollarSign,
    defaultChecked: false,
  },
  {
    id: "exchange",
    title: "Exchange Rate Updates",
    description: "Get notified of rate changes",
    icon: Globe,
    defaultChecked: false,
  },
] as const;

export function Notification() {
  const [state, formAction] = useActionState<ActionState, FormData>(
    updateSettingsAction,
    initialActionState,
  );

  return (
    <form action={formAction} className="mt-8 space-y-6">
      <input type="hidden" name="section" value="Notifications" />

      <div className="space-y-4">
        {notifications.map((item) => (
          <SettingToggle
            key={item.id}
            id={item.id}
            name={`${item.id}-notifications`}
            title={item.title}
            description={item.description}
            icon={item.icon}
            defaultChecked={item.defaultChecked}
          />
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          {state.status === "success" ? (
            <Text className="text-sm text-status-success">{state.message}</Text>
          ) : null}
          {state.status === "error" ? (
            <Text className="text-sm text-status-danger">{state.message}</Text>
          ) : null}
        </div>
        <SubmitButton pendingLabel="Saving notifications...">Save notifications</SubmitButton>
      </div>
    </form>
  );
}
