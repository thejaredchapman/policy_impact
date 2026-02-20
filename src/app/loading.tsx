import { CardSkeleton } from "@/components/ui/Skeleton";

export default function Loading() {
  return (
    <div className="space-y-8">
      <div className="text-[var(--color-term-heading)] text-base">
        &gt; loading...<span className="cursor-blink">_</span>
      </div>
      <div className="space-y-3">
        <div className="h-5 w-40 bg-[var(--color-term-border)] terminal-loading" />
        <div className="h-7 w-96 bg-[var(--color-term-border)] terminal-loading" />
        <div className="h-5 w-full max-w-2xl bg-[var(--color-term-border)] terminal-loading" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
