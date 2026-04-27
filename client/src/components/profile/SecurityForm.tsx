"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldCaption, FieldLabel } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { Heading, Text } from "@/components/ui/typography";
import type { AuthSession } from "@/types";

interface SecurityFormProps {
  session: AuthSession;
}

export function SecurityForm({ session: _session }: SecurityFormProps) {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    setIsLoading(true);
    console.log("Password change requested");
    setTimeout(() => {
      setIsLoading(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      alert("Password updated successfully");
    }, 1000);
  };

  const handleDeleteAccount = async () => {
    if (
      window.confirm(
        "Are you sure you want to delete your account? This action cannot be undone.",
      )
    ) {
      setIsLoading(true);
      console.log("Account deletion requested");
      setTimeout(() => {
        setIsLoading(false);
        alert("Account deleted");
      }, 1000);
    }
  };

  return (
    <Panel variant="securityShell">
      <div>
        <Heading level="h3" className="mb-6 text-xl font-semibold text-text-primary">
          Change Password
        </Heading>
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <FieldLabel>
            <FieldCaption className="font-medium text-text-muted">
              Current password
            </FieldCaption>
            <Input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
            />
          </FieldLabel>

          <FieldLabel>
            <FieldCaption className="font-medium text-text-muted">
              New password
            </FieldCaption>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
          </FieldLabel>

          <FieldLabel>
            <FieldCaption className="font-medium text-text-muted">
              Confirm new password
            </FieldCaption>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </FieldLabel>

          <div className="pt-4">
            <Button
              type="submit"
              variant="passwordSubmit"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
            >
              {isLoading ? "Updating..." : "Update password"}
            </Button>
          </div>
        </form>
      </div>

      <div className="pt-4">
        <Heading level="h3" className="mb-2 text-xl font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </Heading>
        <Text variant="muted" className="mb-6">
          Once you delete your account, there is no going back. Please be certain.
        </Text>

        <Panel variant="dangerZone">
          <div>
            <h4 className="font-medium text-text-primary">Delete Account</h4>
            <Text variant="muted" className="mt-1">
              Permanently remove your account and all associated data.
            </Text>
          </div>
          <Button type="button" variant="dangerSolid" onClick={handleDeleteAccount} disabled={isLoading}>
            {isLoading ? "Processing..." : "Delete Account"}
          </Button>
        </Panel>
      </div>
    </Panel>
  );
}
