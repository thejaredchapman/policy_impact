export function Skeleton({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`terminal-loading bg-[var(--color-term-border)] ${className}`}
      {...props}
    />
  );
}

export function CardSkeleton() {
  return (
    <div className="border border-[var(--color-term-border)] bg-[var(--color-term-bg-light)] p-5 space-y-3">
      <span className="text-[var(--color-term-dim)] text-base terminal-loading inline-block">
        loading...
      </span>
      <Skeleton className="h-5 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export function TerminalLoading({ message = "loading..." }: { message?: string }) {
  return (
    <div className="py-8 text-center">
      <span className="text-[var(--color-term-heading)] text-base">
        &gt; {message}<span className="cursor-blink">_</span>
      </span>
    </div>
  );
}
