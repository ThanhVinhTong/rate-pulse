"use client";

import { KeyRound, MonitorSmartphone, ShieldAlert } from "lucide-react";

import { SettingToggle } from "@/components/ui/SettingToggle";

export function SecuritySettings() {
  return (
    <div className="mt-8 space-y-3">
      <SettingToggle
        id="newDeviceLogin"
        title="New Device Login"
        description="Send an alert when your account is signed in from an unrecognised device."
        icon={MonitorSmartphone}
        defaultChecked={true}
      />
      <SettingToggle
        id="suspiciousActivity"
        title="Suspicious Activity"
        description="Notify me if unusual login patterns or failed attempts are detected."
        icon={ShieldAlert}
        defaultChecked={true}
      />
      <SettingToggle
        id="passwordChange"
        title="Password Change Confirmation"
        description="Receive an email confirmation whenever your password is changed."
        icon={KeyRound}
        defaultChecked={true}
      />
    </div>
  );
}
