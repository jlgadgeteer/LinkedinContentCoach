import "server-only";

type Bucket = { count: number; resetAt: number };

const WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 5;

const buckets = new Map<string, Bucket>();

/**
 * Returns whether `key` may attempt now. Does not record the attempt;
 * call `recordFailure(key)` after a failed authentication to increment.
 * In-memory only, per the Phase 3 plan. Each self-deployed instance has
 * one user, so this is good enough; a Vercel KV backend can replace it
 * later if abuse becomes a concern.
 */
export function checkRateLimit(key: string): { allowed: boolean; resetInMs: number } {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    return { allowed: true, resetInMs: 0 };
  }
  if (bucket.count >= MAX_ATTEMPTS) {
    return { allowed: false, resetInMs: bucket.resetAt - now };
  }
  return { allowed: true, resetInMs: 0 };
}

export function recordFailure(key: string): void {
  const now = Date.now();
  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return;
  }
  existing.count += 1;
  buckets.set(key, existing);
}

export function clearFailures(key: string): void {
  buckets.delete(key);
}
