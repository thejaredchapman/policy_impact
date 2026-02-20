import { CardSkeleton } from "@/components/ui/Skeleton";

export default function ChangesLoading() {
  return (
    <div>
      <div className="text-[var(--color-term-heading)] text-base mb-6">
        &gt; loading changes...<span className="cursor-blink">_</span>
      </div>
      <div className="flex gap-3 mb-6">
        <div className="h-10 flex-1 bg-[var(--color-term-border)] terminal-loading" />
        <div className="h-10 w-36 bg-[var(--color-term-border)] terminal-loading" />
        <div className="h-10 w-36 bg-[var(--color-term-border)] terminal-loading" />
      </div>
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
