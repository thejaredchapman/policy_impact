import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatDate } from "@/lib/utils/date";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const revalidate = 1800;

const eventTypeColors: Record<string, "blue" | "red" | "yellow" | "green" | "purple" | "orange" | "default"> = {
  HEARING: "blue",
  DEADLINE: "red",
  IMPLEMENTATION: "green",
  COURT_DATE: "purple",
  VOTE: "orange",
  COMMENT_PERIOD_END: "yellow",
  OTHER: "default",
};

export default async function UpcomingPage() {
  const events = await prisma.upcomingEvent.findMany({
    where: { eventDate: { gte: new Date() } },
    orderBy: { eventDate: "asc" },
    include: {
      policyChange: {
        select: { id: true, title: true, type: true },
      },
    },
  });

  // Group by month
  const grouped: Record<string, typeof events> = {};
  for (const event of events) {
    const month = formatDate(event.eventDate).replace(/\d+,/, "").trim().split(" ")[0] +
      " " + event.eventDate.getFullYear();
    if (!grouped[month]) grouped[month] = [];
    grouped[month].push(event);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-[var(--color-term-heading)]">
          # Upcoming Policy Events
        </h1>
        <p className="text-sm text-[var(--color-term-dim)] mt-1">
          &gt; cat /upcoming/timeline
        </p>
      </div>

      {events.length > 0 ? (
        <div className="space-y-8">
          {Object.entries(grouped).map(([month, monthEvents]) => (
            <div key={month}>
              <h2 className="text-sm font-bold text-[var(--color-term-heading)] uppercase tracking-wider mb-4">
                === {month} ===
              </h2>
              <div className="space-y-0">
                {monthEvents.map((event, idx) => (
                  <div key={event.id} className="flex items-stretch">
                    {/* Timeline connector */}
                    <div className="flex flex-col items-center w-16 shrink-0">
                      <span className="text-[var(--color-term-heading)] text-base font-bold">
                        {String(event.eventDate.getDate()).padStart(2, "0")}
                      </span>
                      <span className="text-[var(--color-term-dim)] text-sm">
                        {event.eventDate.toLocaleDateString("en-US", {
                          weekday: "short",
                        })}
                      </span>
                      {idx < monthEvents.length - 1 && (
                        <div className="flex-1 w-px bg-[var(--color-term-border)] my-1" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0 pb-4">
                      <Card>
                        <CardBody>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge
                              variant={
                                eventTypeColors[event.eventType] || "default"
                              }
                            >
                              {event.eventType.replace(/_/g, " ")}
                            </Badge>
                          </div>
                          <h3 className="font-semibold text-[var(--color-term-text)] text-base">
                            {event.title}
                          </h3>
                          <p className="text-sm text-[var(--color-term-dim)] mt-1">
                            {event.description}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-[var(--color-term-dim)]">
                            <span>{formatDate(event.eventDate)}</span>
                            {event.location && (
                              <span>@ {event.location}</span>
                            )}
                            {event.policyChange && (
                              <Link
                                href={`/changes/${event.policyChange.id}`}
                                className="text-[var(--color-rubric-favorable)] hover:underline"
                              >
                                &gt; {event.policyChange.title}
                              </Link>
                            )}
                          </div>
                        </CardBody>
                      </Card>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardBody className="text-center py-12 text-[var(--color-term-dim)] text-base">
            &gt; No upcoming events are currently being tracked.
          </CardBody>
        </Card>
      )}
    </div>
  );
}
