import type { Metadata } from "next";

import { loginAction } from "@/app/actions";
import { AuthForm } from "@/components/common/AuthForm";
import { Panel } from "@/components/ui/panel";
import { Heading, Text } from "@/components/ui/typography";

export const metadata: Metadata = {
  title: "Login",
  description: "Access Rate-pulse securely.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
      <Panel variant="glass" padding="lg">
        <Text variant="overlineAccent">
          Secure login
        </Text>
        <Heading level="h1" className="mt-3">
          Compare rates with confidence
        </Heading>
        <Text variant="body" className="mt-4 leading-7">
          Sign in to access your profile, saved preferences, and role-based dashboards. Admin access is
          enabled automatically when the email contains the word <span className="font-medium text-primary">admin</span>.
        </Text>
      </Panel>

      <AuthForm mode="login" action={loginAction} />
    </div>
  );
}
