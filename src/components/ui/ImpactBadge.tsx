const scoreConfig: Record<
  number,
  { label: string; grade: string; color: string; blocks: string }
> = {
  [-2]: {
    label: "CRITICAL",
    grade: "CRITICAL",
    color: "text-[var(--color-rubric-critical)]",
    blocks: "██",
  },
  [-1]: {
    label: "ADVERSE",
    grade: "ADVERSE",
    color: "text-[var(--color-rubric-adverse)]",
    blocks: "█",
  },
  [0]: {
    label: "NEUTRAL",
    grade: "NEUTRAL",
    color: "text-[var(--color-rubric-neutral)]",
    blocks: "·",
  },
  [1]: {
    label: "FAVORABLE",
    grade: "FAVORABLE",
    color: "text-[var(--color-rubric-favorable)]",
    blocks: "█",
  },
  [2]: {
    label: "BENEFICIAL",
    grade: "BENEFICIAL",
    color: "text-[var(--color-rubric-beneficial)]",
    blocks: "██",
  },
};

export function ImpactBadge({
  score,
  showLabel = false,
  size = "md",
}: {
  score: number;
  showLabel?: boolean;
  size?: "sm" | "md" | "lg";
}) {
  const clamped = Math.max(-2, Math.min(2, Math.round(score)));
  const config = scoreConfig[clamped] || scoreConfig[0];

  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
  };

  const displayScore = clamped > 0 ? `+${clamped}` : String(clamped);

  return (
    <span
      className={`inline-flex items-center gap-1 font-bold ${config.color} ${sizeClasses[size]}`}
      title={config.label}
    >
      [{config.blocks} {config.grade} {config.blocks}]
      {size !== "sm" && <span className="text-[var(--color-term-dim)]">{displayScore}</span>}
      {showLabel && <span className="font-normal text-[var(--color-term-dim)]">{config.label}</span>}
    </span>
  );
}

export function ImpactBar({ score }: { score: number }) {
  const clamped = Math.max(-2, Math.min(2, score));
  // Map -2..+2 to 0..12 blocks
  const filled = Math.round(((clamped + 2) / 4) * 12);
  const empty = 12 - filled;

  let color = "text-[var(--color-rubric-neutral)]";
  if (clamped <= -1.5) color = "text-[var(--color-rubric-critical)]";
  else if (clamped <= -0.5) color = "text-[var(--color-rubric-adverse)]";
  else if (clamped < 0.5) color = "text-[var(--color-rubric-neutral)]";
  else if (clamped < 1.5) color = "text-[var(--color-rubric-favorable)]";
  else color = "text-[var(--color-rubric-beneficial)]";

  const displayScore = clamped > 0 ? `+${clamped.toFixed(1)}` : clamped.toFixed(1);

  return (
    <span className="text-base font-mono">
      <span className="text-[var(--color-term-dim)]">[</span>
      <span className={color}>{"█".repeat(filled)}</span>
      <span className="text-[var(--color-term-dim)]">{"░".repeat(empty)}</span>
      <span className="text-[var(--color-term-dim)]">]</span>
      <span className="text-[var(--color-term-dim)] ml-1">{displayScore}</span>
    </span>
  );
}
