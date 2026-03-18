import type { Metadata } from "next";

import { loginAction } from "@/app/actions";
import { AuthForm } from "@/components/common/AuthForm";

export const metadata: Metadata = {
  title: "Login",
  description: "Access the Rate-pulse trading platform securely.",
};

export default function LoginPage() {
  return (
    <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-panel sm:p-8">
        <p className="text-sm uppercase tracking-[0.24em] text-accent">Secure login</p>
        <h1 className="mt-3 text-3xl font-semibold text-white">Trade with confidence</h1>
        <p className="mt-4 text-sm leading-7 text-text-muted">
          Sign in to access your profile, personalized market insights, and role-based
          dashboards. Admin access is enabled automatically when the email contains
          the word <span className="text-white">admin</span>.
        </p>
      </section>

      <AuthForm mode="login" action={loginAction} />
    </div>
  );
}
