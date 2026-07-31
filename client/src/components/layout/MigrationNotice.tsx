import { Info } from "lucide-react";

export function MigrationNotice() {
  return (
    <aside
      aria-label="Service migration notice"
      className="border-b border-amber-300/30 bg-amber-300/10 text-amber-950 dark:text-amber-100"
    >
      <div className="mx-auto flex max-w-7xl items-start justify-center gap-3 px-4 py-3 sm:items-center sm:px-6 lg:px-8">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-300 sm:mt-0" aria-hidden="true" />
        <p className="text-sm leading-6">
          <strong className="font-semibold">We&apos;re currently migrating Rate-pulse.</strong>{" "}
          Some features may be temporarily unavailable. Thank you for your patience.
        </p>
      </div>
    </aside>
  );
}
