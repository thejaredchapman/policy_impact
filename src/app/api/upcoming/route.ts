import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/api/rate-limit";
import { apiSuccess, rateLimitResponse, getClientIP } from "@/lib/api/response";
import type { NextRequest } from "next/server";
import type { EventType } from "@prisma/client";

export const revalidate = 1800;

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const rl = rateLimit(ip);
  if (!rl.allowed) return rateLimitResponse(rl.remaining, rl.resetAt);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "20", 10)));
  const skip = (page - 1) * perPage;

  const where: Record<string, unknown> = {
    eventDate: { gte: new Date() },
  };

  const eventType = searchParams.get("eventType");
  if (eventType) where.eventType = eventType as EventType;

  const [events, total] = await Promise.all([
    prisma.upcomingEvent.findMany({
      where,
      orderBy: { eventDate: "asc" },
      skip,
      take: perPage,
      include: {
        policyChange: {
          select: { id: true, title: true, type: true },
        },
      },
    }),
    prisma.upcomingEvent.count({ where }),
  ]);

  return apiSuccess(events, {
    page,
    perPage,
    total,
    generatedAt: new Date().toISOString(),
  });
}
