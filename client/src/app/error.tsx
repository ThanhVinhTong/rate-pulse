"use client";

import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/Button";
import { Heading, Text } from "@/components/ui/typography";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Alert variant="dangerPanel">
      <Text variant="overlineAccent" className="uppercase tracking-[0.16em] text-status-danger">
        Something went wrong
      </Text>
      <Heading level="h1" className="mt-3 text-2xl font-semibold text-text-primary">
        Unable to load this view
      </Heading>
      <Text variant="error">{error.message || "An unexpected rendering error occurred."}</Text>
      <Button
        type="button"
        variant="secondary"
        className="mt-6"
        onClick={() => reset()}
      >
        Try again
      </Button>
    </Alert>
  );
}
