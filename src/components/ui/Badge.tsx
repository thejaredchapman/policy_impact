const variantColors: Record<string, string> = {
  default: "text-[var(--color-term-dim)]",
  blue: "text-[var(--color-rubric-favorable)]",
  green: "text-[var(--color-rubric-beneficial)]",
  yellow: "text-[var(--color-rubric-adverse)]",
  red: "text-[var(--color-rubric-critical)]",
  purple: "text-[var(--color-type-rule)]",
  orange: "text-[var(--color-rubric-adverse)]",
};

export function Badge({
  children,
  variant = "default",
  className = "",
}: {
  children: React.ReactNode;
  variant?: keyof typeof variantColors;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center text-sm font-bold uppercase ${variantColors[variant] || variantColors.default} ${className}`}
    >
      [{children}]
    </span>
  );
}

const typeColors: Record<string, keyof typeof variantColors> = {
  EXECUTIVE_ORDER: "red",
  LEGISLATION: "blue",
  AGENCY_RULE: "purple",
  AGENCY_PROPOSED_RULE: "orange",
  AGENCY_NOTICE: "yellow",
  APPOINTMENT: "green",
  PROCLAMATION: "blue",
  MEMORANDUM: "default",
  OTHER: "default",
};

const typeLabels: Record<string, string> = {
  EXECUTIVE_ORDER: "EXEC ORDER",
  LEGISLATION: "LEGISLATION",
  AGENCY_RULE: "AGENCY RULE",
  AGENCY_PROPOSED_RULE: "PROPOSED RULE",
  AGENCY_NOTICE: "NOTICE",
  APPOINTMENT: "APPOINTMENT",
  PROCLAMATION: "PROCLAMATION",
  MEMORANDUM: "MEMORANDUM",
  OTHER: "OTHER",
};

export function TypeBadge({ type }: { type: string }) {
  return (
    <Badge variant={typeColors[type] || "default"}>
      {typeLabels[type] || type}
    </Badge>
  );
}

const statusColors: Record<string, keyof typeof variantColors> = {
  TRACKING: "default",
  IN_EFFECT: "green",
  PENDING_IMPLEMENTATION: "yellow",
  CHALLENGED: "orange",
  BLOCKED: "red",
  OVERTURNED: "red",
  SUPERSEDED: "default",
};

const statusLabels: Record<string, string> = {
  TRACKING: "TRACKING",
  IN_EFFECT: "IN EFFECT",
  PENDING_IMPLEMENTATION: "PENDING",
  CHALLENGED: "CHALLENGED",
  BLOCKED: "BLOCKED",
  OVERTURNED: "OVERTURNED",
  SUPERSEDED: "SUPERSEDED",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <Badge variant={statusColors[status] || "default"}>
      {statusLabels[status] || status}
    </Badge>
  );
}
