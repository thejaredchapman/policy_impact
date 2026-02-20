import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/api/rate-limit";
import { apiSuccess, apiError, rateLimitResponse, getClientIP } from "@/lib/api/response";
import { summarizeSchema } from "@/lib/api/validation";
import { generateCustomSummary } from "@/lib/ai/summarize";
import type { NextRequest } from "next/server";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const ip = getClientIP(request);
  // More aggressive rate limit for AI-powered endpoint
  const rl = rateLimit(ip, 10);
  if (!rl.allowed) return rateLimitResponse(rl.remaining, rl.resetAt);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError("INVALID_JSON", "Request body must be valid JSON.", 400);
  }

  const parsed = summarizeSchema.safeParse(body);
  if (!parsed.success) {
    return apiError("VALIDATION_ERROR", parsed.error.issues[0].message, 400);
  }

  const { topic, dateFrom, dateTo } = parsed.data;

  // Find relevant policy changes
  const where: Record<string, unknown> = {
    OR: [
      { title: { contains: topic, mode: "insensitive" } },
      { summary: { contains: topic, mode: "insensitive" } },
      { topics: { hasSome: [topic] } },
    ],
  };

  if (dateFrom || dateTo) {
    where.publicationDate = {};
    if (dateFrom) (where.publicationDate as Record<string, Date>).gte = new Date(dateFrom);
    if (dateTo) (where.publicationDate as Record<string, Date>).lte = new Date(dateTo);
  }

  const changes = await prisma.policyChange.findMany({
    where,
    orderBy: { publicationDate: "desc" },
    take: 10,
    select: { title: true, summary: true, rawContent: true },
  });

  if (changes.length === 0) {
    return apiError(
      "NO_DATA",
      "No policy changes found matching the requested topic.",
      404
    );
  }

  const texts = changes.map(
    (c) => `Title: ${c.title}\n${c.summary}\n${c.rawContent?.slice(0, 3000) || ""}`
  );

  const summary = await generateCustomSummary(topic, texts);

  return apiSuccess({ summary, policiesAnalyzed: changes.length });
}
