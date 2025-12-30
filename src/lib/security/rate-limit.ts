type RateLimitConfig = {
  key: string;
  max: number;
  windowMs: number;
};

type RateLimitState = {
  count: number;
  resetAt: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetMs: number;
};

const buckets = new Map<string, RateLimitState>();

export function rateLimit({ key, max, windowMs }: RateLimitConfig): RateLimitResult {
  const now = Date.now();
  const state = buckets.get(key);

  if (!state || now > state.resetAt) {
    const resetAt = now + windowMs;
    buckets.set(key, { count: 1, resetAt });
    return {
      allowed: true,
      remaining: Math.max(0, max - 1),
      resetMs: windowMs,
    };
  }

  if (state.count >= max) {
    return {
      allowed: false,
      remaining: 0,
      resetMs: Math.max(0, state.resetAt - now),
    };
  }

  state.count += 1;
  buckets.set(key, state);

  return {
    allowed: true,
    remaining: Math.max(0, max - state.count),
    resetMs: Math.max(0, state.resetAt - now),
  };
}
