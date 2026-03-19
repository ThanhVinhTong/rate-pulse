"use client";

import Link from "next/link";
import { useActionState } from "react";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";

import { SubmitButton } from "@/components/ui/SubmitButton";

interface AuthFormProps {
  mode: "login" | "signup";
  action: (state: ActionState, payload: FormData) => Promise<ActionState>;
}

export function AuthForm({ mode, action }: AuthFormProps) {
  const [state, formAction] = useActionState<ActionState, FormData>(
    action,
    initialActionState,
  );

  const isSignup = mode === "signup";

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-white/5 p-6 shadow-panel sm:p-8">
      <div className="mb-8">
        <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">
          {isSignup ? "Create account" : "Welcome back"}
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          {isSignup ? "Open your Rate-pulse workspace" : "Sign in to your trading desk"}
        </h1>
        <p className="mt-3 text-sm leading-6 text-text-muted">
          Demo access is mocked. Use any credentials, or include{" "}
          <span className="text-white">admin</span> in the email to unlock the admin view.
        </p>
      </div>

      <form action={formAction} className="space-y-4">
        {isSignup ? (
          <label className="block space-y-2">
            <span className="text-sm text-text-muted">Full name</span>
            <input
              required
              name="name"
              placeholder="Jordan Lee"
              className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition placeholder:text-text-tertiary focus:border-primary"
            />
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm text-text-muted">Email</span>
          <input
            required
            type="email"
            name="email"
            placeholder={isSignup ? "trader@rate-pulse.trade" : "admin@rate-pulse.trade"}
            className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition placeholder:text-text-tertiary focus:border-primary"
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm text-text-muted">Password</span>
          <input
            required
            type="password"
            name="password"
            placeholder="Enter a secure password"
            className="h-12 w-full rounded-xl border border-white/10 bg-[#0c1220] px-4 text-white outline-none transition placeholder:text-text-tertiary focus:border-primary"
          />
        </label>

        {state.status === "error" ? (
          <p className="rounded-xl border border-status-danger/30 bg-status-danger/10 px-4 py-3 text-sm text-red-200">
            {state.message}
          </p>
        ) : null}

        <SubmitButton className="w-full" pendingLabel={isSignup ? "Creating account..." : "Signing in..."}>
          {isSignup ? "Create account" : "Sign in"}
        </SubmitButton>
      </form>

      <p className="mt-6 text-sm text-text-muted">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-medium text-primary hover:text-accent"
        >
          {isSignup ? "Log in" : "Create one"}
        </Link>
      </p>
    </div>
  );
}
