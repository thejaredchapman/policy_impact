import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/api/rate-limit";
import { apiSuccess, apiError, rateLimitResponse, getClientIP } from "@/lib/api/response";
import type { NextRequest } from "next/server";

export const revalidate = 3600;

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const rl = rateLimit(ip);
  if (!rl.allowed) return rateLimitResponse(rl.remaining, rl.resetAt);

  const digest = await prisma.dailyDigest.findFirst({
    orderBy: { date: "desc" },
    include: {
      entries: {
        include: {
          policyChange: {
            select: {
              id: true,
              title: true,
              type: true,
              status: true,
              publicationDate: true,
              sourceUrl: true,
            },
          },
        },
        orderBy: { orderIndex: "asc" },
      },
    },
  });

  if (!digest) {
    return apiError("NOT_FOUND", "No daily digest available yet.", 404);
  }

  return apiSuccess(
    {
      date: digest.date.toISOString().split("T")[0],
      headline: digest.headline,
      summary: digest.summary,
      entries: digest.entries.map((e) => ({
        policyChangeId: e.policyChange.id,
        title: e.policyChange.title,
        type: e.policyChange.type,
        briefSummary: e.briefSummary,
        sourceUrl: e.policyChange.sourceUrl,
      })),
    },
    { generatedAt: digest.createdAt.toISOString() }
  );
}
