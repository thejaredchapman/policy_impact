import { prisma } from "@/lib/db";
import { Card, CardBody } from "@/components/ui/Card";
import { TypeBadge, StatusBadge } from "@/components/ui/Badge";
import { ImpactBadge } from "@/components/ui/ImpactBadge";
import { ChangeFilters } from "@/components/changes/ChangeFilters";
import { formatDate } from "@/lib/utils/date";
import { ITEMS_PER_PAGE } from "@/lib/utils/constants";
import Link from "next/link";
import { Suspense } from "react";
import type { Prisma, ChangeType, ChangeStatus } from "@prisma/client";

export const dynamic = "force-dynamic";
export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{
    search?: string;
    type?: string;
    status?: string;
    page?: string;
    dateFrom?: string;
    dateTo?: string;
    agency?: string;
  }>;
}

export default async function ChangesPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || "1", 10));
  const skip = (page - 1) * ITEMS_PER_PAGE;

  const where: Prisma.PolicyChangeWhereInput = {};

  if (params.type) {
    where.type = params.type as ChangeType;
  }
  if (params.status) {
    where.status = params.status as ChangeStatus;
  }
  if (params.search) {
    where.OR = [
      { title: { contains: params.search, mode: "insensitive" } },
      { summary: { contains: params.search, mode: "insensitive" } },
      { topics: { hasSome: [params.search] } },
    ];
  }
  if (params.dateFrom || params.dateTo) {
    where.publicationDate = {};
    if (params.dateFrom) where.publicationDate.gte = new Date(params.dateFrom);
    if (params.dateTo) where.publicationDate.lte = new Date(params.dateTo);
  }
  if (params.agency) {
    where.agencies = { has: params.agency };
  }

  const [changes, total, agencyRows] = await Promise.all([
    prisma.policyChange.findMany({
      where,
      orderBy: { publicationDate: "desc" },
      skip,
      take: ITEMS_PER_PAGE,
      include: {
        impactRatings: {
          select: { score: true, confidence: true },
        },
      },
    }),
    prisma.policyChange.count({ where }),
    prisma.$queryRaw<{ agency: string }[]>`
      SELECT DISTINCT unnest(agencies) AS agency
      FROM "PolicyChange"
      ORDER BY agency
    `,
  ]);

  const agencies = agencyRows.map((r) => r.agency);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return (
    <div>
      <h1 className="text-xl font-bold text-[var(--color-term-heading)] mb-1">
        # Policy Change Repository
      </h1>
      <p className="text-sm text-[var(--color-term-dim)] mb-6">
        &gt; cat /changes/index
      </p>

      <Suspense>
        <ChangeFilters agencies={agencies} />
      </Suspense>

      <p className="text-sm text-[var(--color-term-dim)] mb-4">
        --- {total} {total === 1 ? "result" : "results"} found ---
      </p>

      <div className="space-y-3">
        {changes.map((change, idx) => {
          const ratings = change.impactRatings;
          const avgScore =
            ratings.length > 0
              ? ratings.reduce((s, r) => s + r.score * r.confidence, 0) /
                ratings.reduce((s, r) => s + r.confidence, 0)
              : null;

          return (
            <Link key={change.id} href={`/changes/${change.id}`}>
              <Card className="hover:border-[var(--color-term-heading)] transition-colors cursor-pointer">
                <CardBody>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <span className="text-sm text-[var(--color-term-dim)]">
                      [{String(skip + idx + 1).padStart(3, "0")}]
                    </span>
                    <TypeBadge type={change.type} />
                    <StatusBadge status={change.status} />
                    {avgScore !== null && (
                      <ImpactBadge
                        score={Math.round(avgScore * 10) / 10}
                        size="sm"
                      />
                    )}
                    {change.sourceType === "FEDERAL_REGISTER" && (
                      <span className="text-sm text-[var(--color-term-dim)]">
                        {change.federalRegisterNumber}
                      </span>
                    )}
                  </div>
                  <h2 className="font-semibold text-[var(--color-term-text)] text-base mb-1">
                    {change.title}
                  </h2>
                  <p className="text-sm text-[var(--color-term-dim)] line-clamp-2 mb-2">
                    {change.summary}
                  </p>
                  <div className="flex items-center gap-4 text-sm text-[var(--color-term-dim)]">
                    {change.publicationDate && (
                      <span>Published: {formatDate(change.publicationDate)}</span>
                    )}
                    {change.agencies.length > 0 && (
                      <span>{change.agencies.join(", ")}</span>
                    )}
                  </div>
                </CardBody>
              </Card>
            </Link>
          );
        })}
      </div>

      {changes.length === 0 && (
        <Card>
          <CardBody className="text-center py-12 text-[var(--color-term-dim)] text-base">
            &gt; No policy changes found matching your filters.
          </CardBody>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8 text-base">
          {page > 1 && (
            <Link
              href={`/changes?${new URLSearchParams({ ...params, page: String(page - 1) }).toString()}`}
              className="text-[var(--color-rubric-favorable)] hover:underline"
            >
              [&lt; prev]
            </Link>
          )}
          <span className="text-[var(--color-term-dim)]">
            page {page}/{totalPages}
          </span>
          {page < totalPages && (
            <Link
              href={`/changes?${new URLSearchParams({ ...params, page: String(page + 1) }).toString()}`}
              className="text-[var(--color-rubric-favorable)] hover:underline"
            >
              [next &gt;]
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
