export function RubricLegend() {
  return (
    <div className="border border-[var(--color-term-border)] bg-[var(--color-term-bg-light)] text-sm">
      <div className="px-5 py-3 border-b border-[var(--color-term-border)] text-[var(--color-term-heading)]">
        IMPACT RUBRIC LEGEND
      </div>
      <div className="px-5 py-4 space-y-1.5 font-mono">
        <div className="grid grid-cols-[100px_50px_1fr] gap-3 text-[var(--color-term-dim)] border-b border-[var(--color-term-border)] pb-1.5 mb-1.5">
          <span>GRADE</span>
          <span>SCORE</span>
          <span>DESCRIPTION</span>
        </div>
        <div className="grid grid-cols-[100px_50px_1fr] gap-3">
          <span className="text-[var(--color-rubric-critical)]">CRITICAL</span>
          <span className="text-[var(--color-rubric-critical)]">-2</span>
          <span className="text-[var(--color-term-dim)]">Major adverse impact &mdash; significant reduction in rights, access, or protections</span>
        </div>
        <div className="grid grid-cols-[100px_50px_1fr] gap-3">
          <span className="text-[var(--color-rubric-adverse)]">ADVERSE</span>
          <span className="text-[var(--color-rubric-adverse)]">-1</span>
          <span className="text-[var(--color-term-dim)]">Moderate negative impact &mdash; some restrictions or reduced benefits</span>
        </div>
        <div className="grid grid-cols-[100px_50px_1fr] gap-3">
          <span className="text-[var(--color-rubric-neutral)]">NEUTRAL</span>
          <span className="text-[var(--color-rubric-neutral)]">&nbsp;0</span>
          <span className="text-[var(--color-term-dim)]">Minimal or no measurable impact</span>
        </div>
        <div className="grid grid-cols-[100px_50px_1fr] gap-3">
          <span className="text-[var(--color-rubric-favorable)]">FAVORABLE</span>
          <span className="text-[var(--color-rubric-favorable)]">+1</span>
          <span className="text-[var(--color-term-dim)]">Moderate positive impact &mdash; expanded access or protections</span>
        </div>
        <div className="grid grid-cols-[100px_50px_1fr] gap-3">
          <span className="text-[var(--color-rubric-beneficial)]">BENEFICIAL</span>
          <span className="text-[var(--color-rubric-beneficial)]">+2</span>
          <span className="text-[var(--color-term-dim)]">Major positive impact &mdash; significant expansion of rights or resources</span>
        </div>
      </div>
      <div className="px-5 py-3 border-t border-[var(--color-term-border)] text-[var(--color-term-dim)]">
        Confidence: <span className="text-[var(--color-term-text)]">[████████░░]</span> 80% &mdash; Block bars indicate AI confidence level
      </div>
    </div>
  );
}
