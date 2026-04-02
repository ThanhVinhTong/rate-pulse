import type { Metadata } from "next";

import { signupAction } from "@/app/actions";
import { AuthForm } from "@/components/common/AuthForm";
import { Panel } from "@/components/ui/panel";
import { Heading, Text } from "@/components/ui/typography";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new Rate-pulse trading platform account.",
};

export default function SignupPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1fr] lg:items-center">
      <AuthForm mode="signup" action={signupAction} />

      <Panel variant="glass" padding="lg">
        <Text variant="overlineAccent">Fast onboarding</Text>
        <Heading level="h1" className="mt-3">
          Create your Rate-pulse workspace in minutes
        </Heading>
        <Text variant="body" className="mt-4 leading-7">
          This demo uses mock data and server actions so the full flow feels like a production-ready fintech
          application while staying easy to extend later.
        </Text>
      </Panel>
    </div>
  );
}
