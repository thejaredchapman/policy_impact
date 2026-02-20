import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/api/rate-limit";
import { apiSuccess, apiError, rateLimitResponse, getClientIP } from "@/lib/api/response";
import type { NextRequest } from "next/server";

export const revalidate = 600;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = getClientIP(request);
  const rl = rateLimit(ip);
  if (!rl.allowed) return rateLimitResponse(rl.remaining, rl.resetAt);

  const { id } = await params;

  const change = await prisma.policyChange.findUnique({
    where: { id },
    include: {
      impactRatings: {
        orderBy: [{ category: "asc" }, { subcategory: "asc" }],
        select: {
          id: true,
          category: true,
          subcategory: true,
          score: true,
          explanation: true,
          confidence: true,
        },
      },
      upcomingEvents: {
        orderBy: { eventDate: "asc" },
        select: {
          id: true,
          title: true,
          description: true,
          eventType: true,
          eventDate: true,
          location: true,
          sourceUrl: true,
        },
      },
    },
  });

  if (!change) {
    return apiError("NOT_FOUND", "Policy change not found.", 404);
  }

  return apiSuccess(change);
}
