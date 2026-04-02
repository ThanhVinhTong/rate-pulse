import type { Metadata } from "next";

import { loginAction } from "@/app/actions";
import { AuthForm } from "@/components/common/AuthForm";
import { Panel } from "@/components/ui/panel";
import { Heading, Span, Text } from "@/components/ui/typography";

export const metadata: Metadata = {
  title: "Login",
  description: "Access the Rate-pulse trading platform securely.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
      <Panel variant="glass" padding="lg">
        <Text variant="overlineAccent">
          Secure login
        </Text>
        <Heading level="h1" className="mt-3">
          Trade with confidence
        </Heading>
        <Text variant="body" className="mt-4 leading-7">
          Sign in to access your profile, personalized market insights, and role-based dashboards. Admin access is
          enabled automatically when the email contains the word <Span variant="inverse">admin</Span>.
        </Text>
      </Panel>

      <AuthForm mode="login" action={loginAction} />
    </div>
  );
}
