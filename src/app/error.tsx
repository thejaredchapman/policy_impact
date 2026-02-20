"use client";

import { Card, CardBody } from "@/components/ui/Card";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <Card className="max-w-lg mx-auto mt-12">
      <CardBody className="text-center py-12">
        <div className="text-[var(--color-rubric-adverse)] text-5xl mb-4">
          [!]
        </div>
        <h2 className="text-base font-bold text-[var(--color-rubric-critical)] mb-2">
          ERROR: Something went wrong
        </h2>
        <p className="text-[var(--color-term-dim)] mb-6 text-sm">
          {error.message || "An unexpected error occurred."}
        </p>
        <button
          onClick={reset}
          className="px-5 py-2.5 border border-[var(--color-term-heading)] text-[var(--color-term-heading)] text-base font-bold hover:bg-[var(--color-term-heading)] hover:text-[var(--color-term-bg)] transition-colors"
        >
          &gt; retry
        </button>
      </CardBody>
    </Card>
  );
}
