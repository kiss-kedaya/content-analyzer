import { beforeEach, describe, expect, test } from 'vitest'
import { clearLoginFailures, constantTimeEqual, getLoginRateLimit, recordLoginFailure, resetLoginRateLimitsForTests } from '@/lib/login-security'

describe('login security helpers', () => {
  beforeEach(() => resetLoginRateLimitsForTests())

  test('compares credentials using fixed-size digests', () => {
    expect(constantTimeEqual('correct horse', 'correct horse')).toBe(true)
    expect(constantTimeEqual('correct horse', 'wrong')).toBe(false)
  })

  test('blocks the sixth attempt in a fixed window and can be cleared after success', () => {
    const now = 1_000
    for (let index = 0; index < 5; index += 1) recordLoginFailure('client', now)
    expect(getLoginRateLimit('client', now)).toMatchObject({ allowed: false, retryAfterSeconds: 900 })
    clearLoginFailures('client')
    expect(getLoginRateLimit('client', now).allowed).toBe(true)
  })
})
