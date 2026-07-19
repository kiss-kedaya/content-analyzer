import { beforeEach, describe, expect, test, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ queryRaw: vi.fn() }))

vi.mock('@/lib/db', () => ({
  default: { $queryRaw: mocks.queryRaw },
}))

vi.mock('@/lib/logger', () => ({
  createLogger: () => ({ error: vi.fn() }),
}))

import { GET } from '@/app/api/health/route'

describe('health route', () => {
  beforeEach(() => {
    mocks.queryRaw.mockReset()
  })

  test('returns ok when the database responds', async () => {
    mocks.queryRaw.mockResolvedValue([{ '?column?': 1 }])
    const response = await GET()

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ status: 'ok' })
    expect(response.headers.get('cache-control')).toBe('no-store')
  })

  test('returns 503 when the database is unavailable', async () => {
    mocks.queryRaw.mockImplementation(() => {
      throw new Error('database unavailable')
    })
    const response = await GET()

    expect(response.status).toBe(503)
    await expect(response.json()).resolves.toEqual({ status: 'degraded' })
  })
})
