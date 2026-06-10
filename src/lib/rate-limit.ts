/**
 * Simple in-memory rate limiter.
 * Note: on Vercel serverless each invocation may be a different worker,
 * so this provides best-effort protection. For strict production rate limiting
 * replace with Upstash Redis (@upstash/ratelimit).
 */

interface Entry { count: number; resetAt: number }

const store = new Map<string, Entry>();

export interface RateLimitOptions {
  /** Max requests per window */
  limit: number;
  /** Window size in seconds */
  windowSecs: number;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: number;
}

export function rateLimit(key: string, opts: RateLimitOptions): RateLimitResult {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + opts.windowSecs * 1000;
    store.set(key, { count: 1, resetAt });
    return { success: true, limit: opts.limit, remaining: opts.limit - 1, resetAt };
  }

  entry.count++;
  const remaining = Math.max(0, opts.limit - entry.count);
  const success = entry.count <= opts.limit;

  return { success, limit: opts.limit, remaining, resetAt: entry.resetAt };
}

// Prune expired entries every 5 minutes to avoid unbounded memory growth
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetAt) store.delete(key);
  }
}, 5 * 60 * 1000);
