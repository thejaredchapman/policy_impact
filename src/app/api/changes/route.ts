import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/api/rate-limit";
import { apiSuccess, rateLimitResponse, getClientIP } from "@/lib/api/response";
import type { NextRequest } from "next/server";
import type { Prisma, ChangeType, ChangeStatus } from "@prisma/client";

export const revalidate = 300;

export async function GET(request: NextRequest) {
  const ip = getClientIP(request);
  const rl = rateLimit(ip);
  if (!rl.allowed) return rateLimitResponse(rl.remaining, rl.resetAt);

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
  const perPage = Math.min(100, Math.max(1, parseInt(searchParams.get("perPage") || "20", 10)));
  const skip = (page - 1) * perPage;

  const where: Prisma.PolicyChangeWhereInput = {};

  const type = searchParams.get("type");
  if (type) where.type = type as ChangeType;

  const status = searchParams.get("status");
  if (status) where.status = status as ChangeStatus;

  const search = searchParams.get("search");
  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { summary: { contains: search, mode: "insensitive" } },
    ];
  }

  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  if (dateFrom || dateTo) {
    where.publicationDate = {};
    if (dateFrom) where.publicationDate.gte = new Date(dateFrom);
    if (dateTo) where.publicationDate.lte = new Date(dateTo);
  }

  const agency = searchParams.get("agency");
  if (agency) {
    where.agencies = { has: agency };
  }

  const [changes, total] = await Promise.all([
    prisma.policyChange.findMany({
      where,
      orderBy: { publicationDate: "desc" },
      skip,
      take: perPage,
      select: {
        id: true,
        title: true,
        summary: true,
        type: true,
        status: true,
        sourceUrl: true,
        sourceType: true,
        publicationDate: true,
        agencies: true,
        topics: true,
      },
    }),
    prisma.policyChange.count({ where }),
  ]);

  return apiSuccess(changes, {
    page,
    perPage,
    total,
    generatedAt: new Date().toISOString(),
  });
}
