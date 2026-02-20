import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { TypeBadge, StatusBadge } from "@/components/ui/Badge";
import { ImpactBadge } from "@/components/ui/ImpactBadge";
import { RubricLegend } from "@/components/ui/RubricLegend";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 600;

interface PageProps {
  params: Promise<{ id: string }>;
}

function ConfidenceBar({ confidence }: { confidence: number }) {
  const filled = Math.round(confidence * 10);
  const empty = 10 - filled;
  return (
    <span className="text-sm font-mono">
      <span className="text-[var(--color-term-dim)]">[</span>
      <span className="text-[var(--color-term-heading)]">{"█".repeat(filled)}</span>
      <span className="text-[var(--color-term-dim)]">{"░".repeat(empty)}</span>
      <span className="text-[var(--color-term-dim)]">]</span>
      <span className="text-[var(--color-term-dim)] ml-1">{Math.round(confidence * 100)}%</span>
    </span>
  );
}

export default async function ChangeDetailPage({ params }: PageProps) {
  const { id } = await params;

  const change = await prisma.policyChange.findUnique({
    where: { id },
    include: {
      impactRatings: {
        orderBy: [{ category: "asc" }, { subcategory: "asc" }],
      },
      upcomingEvents: {
        orderBy: { eventDate: "asc" },
      },
    },
  });

  if (!change) notFound();

  const ratingsByCategory: Record<
    string,
    typeof change.impactRatings
  > = {};
  for (const rating of change.impactRatings) {
    if (!ratingsByCategory[rating.category]) {
      ratingsByCategory[rating.category] = [];
    }
    ratingsByCategory[rating.category].push(rating);
  }

  const categoryLabels: Record<string, string> = {
    SEX: "Sex",
    MARITAL_STATUS: "Marital Status",
    SEXUAL_ORIENTATION: "Sexual Orientation",
    RELIGION: "Religion",
    ETHNICITY: "Ethnicity",
    SALARY_BRACKET: "Salary Bracket",
    US_STATE: "U.S. State",
    POLITICAL_AFFILIATION: "Political Affiliation",
  };

  return (
    <div className="space-y-6">
      <Link
        href="/changes"
        className="inline-flex items-center gap-1 text-base text-[var(--color-rubric-favorable)] hover:underline"
      >
        &gt; cd ~/changes
      </Link>

      {/* Header */}
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <TypeBadge type={change.type} />
          <StatusBadge status={change.status} />
          {change.executiveOrderNumber && (
            <span className="text-base text-[var(--color-term-dim)]">
              EO {change.executiveOrderNumber}
            </span>
          )}
        </div>
        <h1 className="text-2xl font-bold text-[var(--color-term-heading)]">{change.title}</h1>
        <div className="flex flex-wrap gap-4 mt-2 text-sm text-[var(--color-term-dim)]">
          {change.publicationDate && (
            <span>Published: {formatDate(change.publicationDate)}</span>
          )}
          {change.signingDate && (
            <span>Signed: {formatDate(change.signingDate)}</span>
          )}
          {change.effectiveDate && (
            <span>Effective: {formatDate(change.effectiveDate)}</span>
          )}
        </div>
        {change.agencies.length > 0 && (
          <p className="text-sm text-[var(--color-term-dim)] mt-1">
            Agencies: {change.agencies.join(", ")}
          </p>
        )}
        {change.topics.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {change.topics.map((topic) => (
              <span
                key={topic}
                className="text-sm text-[var(--color-rubric-favorable)]"
              >
                [{topic}]
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Summary */}
      <Card>
        <CardHeader>
          <h2 className="font-semibold text-[var(--color-term-heading)] text-base">
            ## Summary
          </h2>
        </CardHeader>
        <CardBody>
          <p className="text-[var(--color-term-text)] text-base leading-relaxed whitespace-pre-line">
            {change.summary}
          </p>
          <div className="mt-4">
            <a
              href={change.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-[var(--color-rubric-favorable)] hover:underline"
            >
              &gt; open source_url
            </a>
          </div>
        </CardBody>
      </Card>

      {/* Demographic Impact */}
      {change.impactRatings.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-[var(--color-term-heading)] text-base">
              ## Demographic Impact Analysis
            </h2>
            <p className="text-sm text-[var(--color-term-dim)] mt-1">
              Ratings range from -2 (CRITICAL) to +2 (BENEFICIAL).
              Scores are based on direct, measurable policy provisions.
            </p>
          </CardHeader>
          <CardBody>
            <div className="space-y-6">
              {Object.entries(ratingsByCategory).map(
                ([category, ratings]) => (
                  <div key={category}>
                    <h3 className="text-sm font-bold text-[var(--color-term-heading)] mb-3">
                      ### {categoryLabels[category] || category}
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {ratings.map((rating) => (
                        <div
                          key={rating.id}
                          className="border border-[var(--color-term-border)] p-3"
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-bold text-[var(--color-term-text)]">
                              {rating.subcategory}
                            </span>
                            <ImpactBadge score={rating.score} size="sm" />
                          </div>
                          <p className="text-sm text-[var(--color-term-dim)] line-clamp-3">
                            {rating.explanation}
                          </p>
                          <div className="mt-2">
                            <ConfidenceBar confidence={rating.confidence} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              )}
            </div>
          </CardBody>
        </Card>
      )}

      {/* Related Events */}
      {change.upcomingEvents.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-[var(--color-term-heading)] text-base">
              ## Related Events
            </h2>
          </CardHeader>
          <CardBody>
            {change.upcomingEvents.map((event, idx) => (
              <div
                key={event.id}
                className={`py-2 ${idx > 0 ? "border-t border-[var(--color-term-border)]" : ""}`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[var(--color-term-dim)]">|</span>
                  <span className="text-sm font-bold text-[var(--color-rubric-favorable)] uppercase">
                    [{event.eventType.replace(/_/g, " ")}]
                  </span>
                  <span className="text-sm text-[var(--color-term-dim)]">
                    {formatDate(event.eventDate)}
                  </span>
                </div>
                <p className="text-base text-[var(--color-term-text)] ml-5">{event.title}</p>
                <p className="text-sm text-[var(--color-term-dim)] ml-5">{event.description}</p>
              </div>
            ))}
          </CardBody>
        </Card>
      )}

      {/* Rubric Legend */}
      <RubricLegend />
    </div>
  );
}
