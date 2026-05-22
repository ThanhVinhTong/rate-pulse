import Link from "next/link";
import { AlertTriangle, CheckCircle, Loader2 } from "lucide-react";

const API_BASE_URL = process.env.RATE_PULSE_API_BASE_URL ?? "https://api.rate-pulse.me";
const VERIFY_EMAIL_ENDPOINT = `${API_BASE_URL}/users/verify-email`;

type VerifyStatus = "success" | "error";

type VerifyEmailPageProps = {
  searchParams?: Promise<{
    email_id?: string | string[];
    secret_code?: string | string[];
  }>;
};

type VerifyResult = {
  status: VerifyStatus;
  message: string;
};

function getSingleParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function parseEmailId(value: string | undefined) {
  if (!value || !/^\d+$/.test(value)) {
    return null;
  }

  const emailId = Number(value);
  return Number.isSafeInteger(emailId) && emailId > 0 ? emailId : null;
}

async function readErrorMessage(response: Response) {
  const fallback = "Verification failed. The link may be invalid or expired.";

  try {
    const data: unknown = await response.json();

    if (
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof data.error === "string"
    ) {
      return data.error;
    }

    if (
      data &&
      typeof data === "object" &&
      "message" in data &&
      typeof data.message === "string"
    ) {
      return data.message;
    }
  } catch {
    // Keep the generic message when the API does not return JSON.
  }

  return fallback;
}

async function verifyEmail(emailId: number, secretCode: string): Promise<VerifyResult> {
  try {
    const response = await fetch(VERIFY_EMAIL_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      cache: "no-store",
      body: JSON.stringify({
        email_id: emailId,
        secret_code: secretCode,
      }),
    });

    if (!response.ok) {
      return {
        status: "error",
        message: await readErrorMessage(response),
      };
    }

    return {
      status: "success",
      message: "Your email address has been verified. You can now sign in to Rate Pulse.",
    };
  } catch {
    return {
      status: "error",
      message: "We could not verify your email right now. Please try again later.",
    };
  }
}

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const emailId = parseEmailId(getSingleParam(params?.email_id));
  const secretCode = getSingleParam(params?.secret_code)?.trim();

  const result =
    emailId && secretCode
      ? await verifyEmail(emailId, secretCode)
      : {
          status: "error" as const,
          message: "Invalid verification link. Please request a new verification email.",
        };

  const isSuccess = result.status === "success";
  const Icon = isSuccess ? CheckCircle : AlertTriangle;

  return (
    <main className="min-h-screen bg-background px-4 py-16 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-8rem)] w-full max-w-md items-center">
        <div className="w-full overflow-hidden rounded-lg border border-border bg-card shadow-sm">
          <header className="border-b border-border bg-primary px-8 py-7 text-center text-white">
            <p className="text-3xl font-bold tracking-tight">Rate Pulse</p>
            <p className="mt-2 text-sm text-primary-foreground/80">
              Email verification
            </p>
          </header>

          <div className="px-8 py-10 text-center">
            <Icon
              aria-hidden="true"
              className={
                isSuccess
                  ? "mx-auto h-16 w-16 text-green-600"
                  : "mx-auto h-16 w-16 text-destructive"
              }
            />

            <h1 className="mt-6 text-2xl font-semibold tracking-tight">
              {isSuccess ? "Email verified" : "Verification failed"}
            </h1>

            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              {result.message}
            </p>

            <div className="mt-8 flex flex-col gap-3">
              <Link
                href="/login"
                className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-medium text-white transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                Continue to login
              </Link>

              {!isSuccess ? (
                <Link
                  href="/signup"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-5 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  Create a new account
                </Link>
              ) : null}
            </div>
          </div>

          <footer className="border-t border-border px-6 py-4 text-center text-xs text-muted-foreground">
            © 2026 Rate Pulse. All rights reserved.
          </footer>
        </div>
      </section>
    </main>
  );
}