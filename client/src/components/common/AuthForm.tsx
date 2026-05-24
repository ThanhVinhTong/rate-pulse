"use client";

import { useActionState } from "react";

import type { ActionState } from "@/lib/action-state";
import { initialActionState } from "@/lib/action-state";

import { Alert } from "@/components/ui/alert";
import { FieldCaption, FieldLabel } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Panel } from "@/components/ui/panel";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Heading, Text } from "@/components/ui/typography";
import { TextLink } from "@/components/ui/text-link";

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
    <Panel variant="glass" padding="lg">
      <div className="mb-8">
        <Text variant="overlineAccent">
          {isSignup ? "Create account" : "Welcome back"}
        </Text>
        <Heading level="h1" className="mt-3">
          {isSignup ? "Create your Rate-pulse account" : "Sign in to Rate-pulse"}
        </Heading>
      </div>

      <form action={formAction} className="space-y-4">
        {isSignup ? (
          <div className="flex flex-col gap-4 sm:flex-row">
            <FieldLabel variant="fieldRow">
              <FieldCaption>First name</FieldCaption>
              <Input required name="first_name" placeholder="Jordan" />
            </FieldLabel>
            <FieldLabel variant="fieldRow">
              <FieldCaption>Last name</FieldCaption>
              <Input required name="last_name" placeholder="Lee" />
            </FieldLabel>
          </div>
        ) : null}

        <FieldLabel>
          <FieldCaption>Email</FieldCaption>
          <Input
            required
            type="email"
            name="email"
            placeholder={isSignup ? "you@example.com" : "you@example.com"}
          />
        </FieldLabel>

        <FieldLabel>
          <FieldCaption>Password</FieldCaption>
          <Input
            required
            type="password"
            name="password"
            minLength={isSignup ? 15 : undefined}
            autoComplete={isSignup ? "new-password" : "current-password"}
            placeholder={isSignup ? "At least 15 characters" : "Enter your password"}
          />
          {isSignup ? (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-text-muted">
              <li>Use a unique passphrase that is hard to guess, such as four or more unrelated words.</li>
              <li>Symbols, numbers, and uppercase letters are optional.</li>
            </ul>
          ) : null}
        </FieldLabel>

        {state.status === "error" ? <Alert>{state.message}</Alert> : null}
        {state.status === "success" ? (
          <Alert className="border-status-success/30 bg-status-success/10 text-status-success">
            {state.message}
          </Alert>
        ) : null}

        <SubmitButton className="w-full" pendingLabel={isSignup ? "Creating account..." : "Signing in..."}>
          {isSignup ? "Create account" : "Sign in"}
        </SubmitButton>
      </form>

      <Text variant="muted" className="mt-6">
        {isSignup ? "Already have an account?" : "Need an account?"}{" "}
        <TextLink href={isSignup ? "/login" : "/signup"}>
          {isSignup ? "Log in" : "Create one"}
        </TextLink>
      </Text>
    </Panel>
  );
}
