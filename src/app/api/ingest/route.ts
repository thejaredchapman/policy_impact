import { runDailyIngestion } from "@/lib/ingestion/orchestrator";
import { apiSuccess, apiError } from "@/lib/api/response";
import type { NextRequest } from "next/server";

export const maxDuration = 300;

export async function POST(request: NextRequest) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret) {
    if (!authHeader || authHeader !== `Bearer ${cronSecret}`) {
      return apiError("UNAUTHORIZED", "Invalid or missing authorization.", 401);
    }
  }

  try {
    const daysBack = parseInt(
      new URL(request.url).searchParams.get("daysBack") || "1",
      10
    );
    const result = await runDailyIngestion(daysBack);

    return apiSuccess({
      federalRegister: {
        found: result.federalRegisterFound,
        new: result.federalRegisterNew,
      },
      apNews: {
        found: result.apNewsFound,
        new: result.apNewsNew,
      },
      digestGenerated: result.digestGenerated,
      errors: result.errors,
    });
  } catch (e) {
    return apiError(
      "INGESTION_FAILED",
      e instanceof Error ? e.message : "Ingestion failed.",
      500
    );
  }
}
