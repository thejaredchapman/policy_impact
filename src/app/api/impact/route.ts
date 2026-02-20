import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/api/rate-limit";
import { apiSuccess, apiError, rateLimitResponse, getClientIP } from "@/lib/api/response";
import { impactProfileSchema } from "@/lib/api/validation";
import type { NextRequest } from "next/server";
import type { DemographicCategory } from "@prisma/client";
import type { PersonalizedImpactResult, CategoryScore, ImpactDetail } from "@/types";

const CATEGORY_MAP: Record<string, DemographicCategory> = {
  sex: "SEX",
  maritalStatus: "MARITAL_STATUS",
  sexualOrientation: "SEXUAL_ORIENTATION",
  religion: "RELIGION",
  ethnicity: "ETHNICITY",
  salaryBracket: "SALARY_BRACKET",
  usState: "US_STATE",
  politicalAffiliation: "POLITICAL_AFFILIATION",
};

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  const rl = rateLimit(ip);
  if (!rl.allowed) return rateLimitResponse(rl.remaining, rl.resetAt);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = impactProfileSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, 400);
  }

  const profile = parsed.data;

  // Build conditions from profile
  const conditions = Object.entries(profile)
    .filter(([, value]) => value)
    .map(([key, value]) => ({
      category: CATEGORY_MAP[key],
      subcategory: value as string,
    }));

  if (conditions.length === 0) {
    return apiError("VALIDATION_ERROR", "At least one demographic field is required.", 400);
  }

  // Query matching impact ratings
  const ratings = await prisma.impactRating.findMany({
    where: {
      OR: conditions.map((c) => ({
        category: c.category,
        subcategory: c.subcategory,
      })),
    },
    include: {
      policyChange: {
        select: {
          id: true,
          title: true,
          publicationDate: true,
        },
      },
    },
    orderBy: { policyChange: { publicationDate: "desc" } },
  });

  // Calculate overall score (confidence-weighted)
  const totalWeight = ratings.reduce((sum, r) => sum + r.confidence, 0);
  const overallScore =
    totalWeight > 0
      ? Math.round(
          (ratings.reduce((sum, r) => sum + r.score * r.confidence, 0) /
            totalWeight) *
            100
        ) / 100
      : 0;

  // Unique policy IDs
  const policyIds = new Set(ratings.map((r) => r.policyChangeId));

  // Group by category
  const byCategory: Record<string, typeof ratings> = {};
  for (const r of ratings) {
    if (!byCategory[r.category]) byCategory[r.category] = [];
    byCategory[r.category].push(r);
  }

  const categoryBreakdown: CategoryScore[] = Object.entries(byCategory).map(
    ([category, catRatings]) => {
      const catWeight = catRatings.reduce((s, r) => s + r.confidence, 0);
      const avgScore =
        catWeight > 0
          ? Math.round(
              (catRatings.reduce((s, r) => s + r.score * r.confidence, 0) /
                catWeight) *
                100
            ) / 100
          : 0;

      const sorted = [...catRatings].sort(
        (a, b) => Math.abs(b.score) - Math.abs(a.score)
      );
      const most = sorted[0];

      return {
        category: category.replace(/_/g, " "),
        averageScore: avgScore,
        count: catRatings.length,
        mostImpactful: most
          ? {
              policyChangeId: most.policyChange.id,
              policyTitle: most.policyChange.title,
              score: most.score,
              confidence: most.confidence,
              explanation: most.explanation,
              category: most.category,
              subcategory: most.subcategory,
              publicationDate: most.policyChange.publicationDate?.toISOString() ?? null,
            }
          : null,
      };
    }
  );

  function toDetail(r: (typeof ratings)[number]): ImpactDetail {
    return {
      policyChangeId: r.policyChange.id,
      policyTitle: r.policyChange.title,
      score: r.score,
      confidence: r.confidence,
      explanation: r.explanation,
      category: r.category,
      subcategory: r.subcategory,
      publicationDate: r.policyChange.publicationDate?.toISOString() ?? null,
    };
  }

  const topPositive = [...ratings]
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score * b.confidence - a.score * a.confidence)
    .slice(0, 5)
    .map(toDetail);

  const topNegative = [...ratings]
    .filter((r) => r.score < 0)
    .sort((a, b) => a.score * a.confidence - b.score * b.confidence)
    .slice(0, 5)
    .map(toDetail);

  const recentChanges = ratings.slice(0, 10).map(toDetail);

  const result: PersonalizedImpactResult = {
    overallScore,
    totalPoliciesAnalyzed: policyIds.size,
    categoryBreakdown,
    topPositive,
    topNegative,
    recentChanges,
  };

  return apiSuccess(result);
}
