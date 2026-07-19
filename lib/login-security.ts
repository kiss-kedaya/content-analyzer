import { createHash, timingSafeEqual } from 'node:crypto'

const WINDOW_MS = 15 * 60 * 1000
const MAX_FAILURES = 5

type Attempt = { count: number; resetAt: number }
const globalRateLimit = globalThis as typeof globalThis & { __contentAnalyzerLoginAttempts?: Map<string, Attempt> }
const attempts = globalRateLimit.__contentAnalyzerLoginAttempts ?? new Map<string, Attempt>()
globalRateLimit.__contentAnalyzerLoginAttempts = attempts

export function constantTimeEqual(left: string, right: string): boolean {
  const leftDigest = createHash('sha256').update(left).digest()
  const rightDigest = createHash('sha256').update(right).digest()
  return timingSafeEqual(leftDigest, rightDigest)
}

export function getLoginRateLimit(key: string, now = Date.now()) {
  const attempt = attempts.get(key)
  if (!attempt || attempt.resetAt <= now) {
    if (attempt) attempts.delete(key)
    return { allowed: true, retryAfterSeconds: 0 }
  }

  return {
    allowed: attempt.count < MAX_FAILURES,
    retryAfterSeconds: Math.max(1, Math.ceil((attempt.resetAt - now) / 1000)),
  }
}

export function recordLoginFailure(key: string, now = Date.now()) {
  const current = attempts.get(key)
  const next = !current || current.resetAt <= now
    ? { count: 1, resetAt: now + WINDOW_MS }
    : { ...current, count: current.count + 1 }
  attempts.set(key, next)
  return getLoginRateLimit(key, now)
}

export function clearLoginFailures(key: string) {
  attempts.delete(key)
}

export function resetLoginRateLimitsForTests() {
  attempts.clear()
}
