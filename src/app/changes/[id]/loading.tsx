export default function ChangeDetailLoading() {
  return (
    <div className="space-y-6">
      <div className="text-[var(--color-term-heading)] text-base">
        &gt; loading change details...<span className="cursor-blink">_</span>
      </div>
      <div className="space-y-2">
        <div className="flex gap-2">
          <div className="h-5 w-24 bg-[var(--color-term-border)] terminal-loading" />
          <div className="h-5 w-20 bg-[var(--color-term-border)] terminal-loading" />
        </div>
        <div className="h-7 w-3/4 bg-[var(--color-term-border)] terminal-loading" />
        <div className="h-4 w-48 bg-[var(--color-term-border)] terminal-loading" />
      </div>
      <div className="border border-[var(--color-term-border)] bg-[var(--color-term-bg-light)] p-4 space-y-3">
        <div className="h-4 w-24 bg-[var(--color-term-border)] terminal-loading" />
        <div className="h-4 w-full bg-[var(--color-term-border)] terminal-loading" />
        <div className="h-4 w-full bg-[var(--color-term-border)] terminal-loading" />
        <div className="h-4 w-5/6 bg-[var(--color-term-border)] terminal-loading" />
      </div>
      <div className="border border-[var(--color-term-border)] bg-[var(--color-term-bg-light)] p-4 space-y-3">
        <div className="h-4 w-48 bg-[var(--color-term-border)] terminal-loading" />
        <div className="grid grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-20 bg-[var(--color-term-border)] terminal-loading" />
          ))}
        </div>
      </div>
    </div>
  );
}
