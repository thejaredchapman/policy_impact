import { NextResponse } from "next/server";
import type { APIResponse } from "@/types";

export function apiSuccess<T>(
  data: T,
  meta?: APIResponse<T>["meta"],
  status = 200
) {
  const body: APIResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };
  return NextResponse.json(body, { status });
}

export function apiError(
  code: string,
  message: string,
  status = 400
) {
  const body: APIResponse<never> = {
    success: false,
    error: { code, message },
  };
  return NextResponse.json(body, { status });
}

export function rateLimitResponse(remaining: number, resetAt: number) {
  return new NextResponse(
    JSON.stringify({
      success: false,
      error: { code: "RATE_LIMITED", message: "Too many requests." },
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "X-RateLimit-Remaining": String(remaining),
        "Retry-After": String(Math.ceil((resetAt - Date.now()) / 1000)),
      },
    }
  );
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  return "127.0.0.1";
}
