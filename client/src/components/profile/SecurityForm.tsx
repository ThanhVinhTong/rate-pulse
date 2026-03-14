"use client";

import { useState } from "react";
import type { AuthSession } from "@/types";

interface SecurityFormProps {
  session: AuthSession;
}

export function SecurityForm({ session }: SecurityFormProps) {
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
    // TODO: Implement password change logic with API
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
        "Are you sure you want to delete your account? This action cannot be undone."
      )
    ) {
      setIsLoading(true);
      // TODO: Implement account deletion logic with API
      console.log("Account deletion requested");
      setTimeout(() => {
        setIsLoading(false);
        alert("Account deleted");
      }, 1000);
    }
  };

  return (
    <div className="mt-8 space-y-12 w-full rounded-2xl bg-white p-6 shadow-sm dark:bg-transparent dark:p-0 dark:shadow-none">
      {/* Change Password Section */}
      <div>
        <h2 className="mb-6 text-xl font-semibold text-gray-900 dark:text-white">
          Change Password
        </h2>
        <form onSubmit={handlePasswordChange} className="max-w-md space-y-4">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-text-muted">Current password</span>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-primary dark:border-white/10 dark:bg-[#0c1220] dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-text-muted">New password</span>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-primary dark:border-white/10 dark:bg-[#0c1220] dark:text-white"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-gray-700 dark:text-text-muted">Confirm new password</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-gray-900 outline-none transition focus:border-primary dark:border-white/10 dark:bg-[#0c1220] dark:text-white"
            />
          </label>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
              className="rounded-xl bg-primary px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              {isLoading ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </div>

      {/* Danger Zone Section */}
      <div className="pt-4">
        <h2 className="mb-2 text-xl font-semibold text-red-600 dark:text-red-400">
          Danger Zone
        </h2>
        <p className="mb-6 text-sm text-gray-500 dark:text-text-muted">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-red-200 bg-red-50 p-6 dark:border-red-900/20 dark:bg-[#0c1220]">
          <div>
            <h4 className="font-medium text-gray-900 dark:text-white">Delete Account</h4>
            <p className="mt-1 text-sm text-gray-500 dark:text-text-muted">
              Permanently remove your account and all associated data.
            </p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={isLoading}
            className="whitespace-nowrap rounded-xl bg-red-600 px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50 dark:bg-red-900/80 dark:text-red-100 dark:hover:bg-red-900"
          >
            {isLoading ? "Processing..." : "Delete Account"}
          </button>
        </div>
      </div>
    </div>
  );
}
