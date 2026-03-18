"use client";

import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="rounded-2xl border border-status-danger/20 bg-status-danger/10 p-6">
      <p className="text-sm uppercase tracking-[0.24em] text-red-200">Something went wrong</p>
      <h1 className="mt-3 text-2xl font-semibold text-white">Unable to load this view</h1>
      <p className="mt-3 max-w-2xl text-sm leading-6 text-red-100/90">
        {error.message || "An unexpected rendering error occurred."}
      </p>
      <Button type="button" variant="secondary" className="mt-6 bg-white text-[#242e44] hover:bg-white/90" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
