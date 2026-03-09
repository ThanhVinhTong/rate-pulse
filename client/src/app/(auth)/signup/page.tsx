import type { Metadata } from "next";

import { signupAction } from "@/app/actions";
import { AuthForm } from "@/components/common/AuthForm";

export const metadata: Metadata = {
  title: "Sign Up",
  description: "Create a new Rate-pulse trading platform account.",
};

export default function SignupPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[0.9fr_1fr] lg:items-center">
      <AuthForm mode="signup" action={signupAction} />

      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-panel sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-accent">Fast onboarding</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">
          Create your Rate-pulse workspace in minutes
        </h1>
        <p className="mt-4 text-sm leading-7 text-text-muted">
          This demo uses mock data and server actions so the full flow feels like a
          production-ready fintech application while staying easy to extend later.
        </p>
      </section>
    </div>
  );
}
