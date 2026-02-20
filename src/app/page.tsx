import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { TypeBadge } from "@/components/ui/Badge";
import { ImpactBadge } from "@/components/ui/ImpactBadge";
import { RubricLegend } from "@/components/ui/RubricLegend";
import { formatDate, formatRelative } from "@/lib/utils/date";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

async function getLatestDigest() {
  return prisma.dailyDigest.findFirst({
    orderBy: { date: "desc" },
    include: {
      entries: {
        include: {
          policyChange: {
            include: {
              impactRatings: {
                select: { score: true, confidence: true },
              },
            },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });
}

async function getUpcomingEvents() {
  return prisma.upcomingEvent.findMany({
    where: { eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
    take: 5,
    include: {
      policyChange: { select: { id: true, title: true } },
    },
  });
}

async function getRecentChanges() {
  return prisma.policyChange.findMany({
    orderBy: { createdAt: "desc" },
    take: 6,
    include: {
      impactRatings: {
        select: { score: true, confidence: true },
      },
    },
  });
}

function averageImpact(
  ratings: { score: number; confidence: number }[]
): number | null {
  if (ratings.length === 0) return null;
  const weighted = ratings.reduce(
    (acc, r) => ({
      sum: acc.sum + r.score * r.confidence,
      weight: acc.weight + r.confidence,
    }),
    { sum: 0, weight: 0 }
  );
  return weighted.weight > 0
    ? Math.round((weighted.sum / weighted.weight) * 10) / 10
    : null;
}

export default async function DashboardPage() {
  const [digest, events, recentChanges] = await Promise.all([
    getLatestDigest(),
    getUpcomingEvents(),
    getRecentChanges(),
  ]);

  return (
    <div className="space-y-8">
      <div className="text-[var(--color-term-heading)] text-base">
        &gt; loading daily digest...<span className="text-[var(--color-term-dim)]"> done</span>
      </div>

      {/* Daily Digest Section */}
      <section>
        {digest ? (
          <>
            <div className="mb-4">
              <p className="text-sm text-[var(--color-term-dim)] mb-1">
                # Daily Digest &mdash; {formatDate(digest.date)}
              </p>
              <h1 className="text-2xl font-bold text-[var(--color-term-heading)]">
                {digest.headline}
              </h1>
              <p className="mt-2 text-[var(--color-term-text)] leading-relaxed text-base">
                {digest.summary}
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {digest.entries.map((entry, idx) => {
                const avg = averageImpact(entry.policyChange.impactRatings);
                return (
                  <Link
                    key={entry.id}
                    href={`/changes/${entry.policyChange.id}`}
                  >
                    <Card className="h-full hover:border-[var(--color-term-heading)] transition-colors cursor-pointer">
                      <CardBody>
                        <div className="text-[var(--color-term-dim)] text-sm mb-2">
                          [{String(idx + 1).padStart(3, "0")}]
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <TypeBadge type={entry.policyChange.type} />
                          {avg !== null && <ImpactBadge score={avg} size="sm" />}
                        </div>
                        <h3 className="font-semibold text-base text-[var(--color-term-text)] mb-1">
                          {entry.policyChange.title}
                        </h3>
                        <p className="text-sm text-[var(--color-term-dim)] line-clamp-3">
                          {entry.briefSummary}
                        </p>
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </>
        ) : (
          <Card>
            <CardBody className="text-center py-12">
              <div className="text-[var(--color-term-dim)] text-base">
                &gt; cat /digest/latest<br />
                <span className="text-[var(--color-rubric-adverse)]">
                  ERROR: No digest available yet.
                </span>
                <br />
                <span className="text-[var(--color-term-dim)] mt-2 block">
                  The daily digest will appear here once the ingestion pipeline runs.
                </span>
              </div>
            </CardBody>
          </Card>
        )}
      </section>

      {/* Recent Changes (shown when no digest) */}
      {!digest && recentChanges.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-[var(--color-term-heading)]">
              # Recent Policy Changes
            </h2>
            <Link
              href="/changes"
              className="text-sm text-[var(--color-rubric-favorable)] hover:underline"
            >
              &gt; ls --all
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentChanges.map((change, idx) => {
              const avg = averageImpact(change.impactRatings);
              return (
                <Link key={change.id} href={`/changes/${change.id}`}>
                  <Card className="h-full hover:border-[var(--color-term-heading)] transition-colors cursor-pointer">
                    <CardBody>
                      <div className="text-[var(--color-term-dim)] text-sm mb-2">
                        [{String(idx + 1).padStart(3, "0")}]
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <TypeBadge type={change.type} />
                        {avg !== null && <ImpactBadge score={avg} size="sm" />}
                      </div>
                      <h3 className="font-semibold text-base text-[var(--color-term-text)] mb-1">
                        {change.title}
                      </h3>
                      <p className="text-sm text-[var(--color-term-dim)] line-clamp-3">
                        {change.summary}
                      </p>
                      {change.publicationDate && (
                        <p className="text-sm text-[var(--color-term-dim)] mt-2">
                          {formatRelative(change.publicationDate)}
                        </p>
                      )}
                    </CardBody>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Upcoming Events */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-bold text-[var(--color-term-heading)]">
            # Upcoming Events
          </h2>
          <Link
            href="/upcoming"
            className="text-sm text-[var(--color-rubric-favorable)] hover:underline"
          >
            &gt; ls --all
          </Link>
        </div>
        {events.length > 0 ? (
          <Card>
            <CardBody className="space-y-0">
              {events.map((event, idx) => (
                <div key={event.id} className={`py-2 ${idx > 0 ? "border-t border-[var(--color-term-border)]" : ""}`}>
                  <div className="flex items-start gap-3">
                    <span className="text-[var(--color-term-dim)] text-sm shrink-0 mt-0.5">
                      |
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-[var(--color-rubric-favorable)] uppercase">
                          [{event.eventType.replace(/_/g, " ")}]
                        </span>
                        <span className="text-sm text-[var(--color-term-dim)]">
                          {formatDate(event.eventDate)}
                        </span>
                      </div>
                      <p className="text-base text-[var(--color-term-text)] truncate">
                        {event.title}
                      </p>
                      {event.policyChange && (
                        <Link
                          href={`/changes/${event.policyChange.id}`}
                          className="text-sm text-[var(--color-rubric-favorable)] hover:underline"
                        >
                          &gt; Related: {event.policyChange.title}
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </CardBody>
          </Card>
        ) : (
          <Card>
            <CardBody className="text-center py-8 text-[var(--color-term-dim)] text-base">
              No upcoming events tracked yet.
            </CardBody>
          </Card>
        )}
      </section>

      {/* Rubric Legend */}
      <section>
        <RubricLegend />
      </section>
    </div>
  );
}
