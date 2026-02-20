const rateMap = new Map<string, { tokens: number; lastRefill: number }>();

export function rateLimit(
  ip: string,
  limit: number = parseInt(process.env.API_RATE_LIMIT_PER_MINUTE || "60", 10)
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowMs = 60_000;

  let entry = rateMap.get(ip);
  if (!entry || now - entry.lastRefill > windowMs) {
    entry = { tokens: limit, lastRefill: now };
    rateMap.set(ip, entry);
  }

  if (entry.tokens > 0) {
    entry.tokens -= 1;
    return {
      allowed: true,
      remaining: entry.tokens,
      resetAt: entry.lastRefill + windowMs,
    };
  }

  return {
    allowed: false,
    remaining: 0,
    resetAt: entry.lastRefill + windowMs,
  };
}

// Clean up stale entries periodically
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateMap.entries()) {
      if (now - entry.lastRefill > 120_000) {
        rateMap.delete(key);
      }
    }
  }, 60_000);
}
