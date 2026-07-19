import { describe, expect, test, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { createCollectionRouteHandlers, createFavoriteRouteHandlers, createPaginatedRouteHandler } from '@/lib/content-route-handlers'
import { mapWithConcurrency } from '@/lib/content-batch-handler'

describe('shared content route handlers', () => {
  test('validates and normalizes a create request without leaking unsupported sourceTime', async () => {
    const create = vi.fn(async (input) => ({ id: 'created-1', ...input }))
    const handlers = createCollectionRouteHandlers({
      context: '/api/adult-content',
      allowSourceTime: false,
      create,
      list: vi.fn(async () => []),
    })
    const request = new NextRequest('http://localhost/api/adult-content', {
      method: 'POST',
      body: JSON.stringify({
        source: 'twitter',
        url: 'https://x.com/example/status/1',
        content: 'saved post',
        sourceTime: 1234,
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await handlers.POST(request)
    expect(response.status).toBe(201)
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ source: 'X', sourceTime: undefined }))
  })

  test('returns structured 400 and 404 responses for invalid input and missing favorites', async () => {
    const list = vi.fn(async () => [])
    const collection = createCollectionRouteHandlers({
      context: '/api/content',
      allowSourceTime: true,
      create: vi.fn(async () => ({ id: 'unused' })),
      list,
    })
    const invalidOrder = await collection.GET(new NextRequest('http://localhost/api/content?orderBy=score'))
    expect(invalidOrder.status).toBe(400)
    expect(list).not.toHaveBeenCalled()
    expect(await invalidOrder.json()).toMatchObject({ success: false, error: { code: 'INVALID_PARAMETER' } })

    const favorite = createFavoriteRouteHandlers({
      context: '/api/content',
      setFavorite: vi.fn(async () => false),
    })
    const missing = await favorite.POST(
      new NextRequest('http://localhost/api/content/missing/favorite', { method: 'POST' }),
      { params: Promise.resolve({ id: 'missing' }) },
    )
    expect(missing.status).toBe(404)
    expect(await missing.json()).toMatchObject({ success: false, error: { code: 'NOT_FOUND' } })
  })

  test('keeps batch work ordered while enforcing bounded concurrency', async () => {
    let active = 0
    let maxActive = 0
    const values = await mapWithConcurrency([0, 1, 2, 3, 4], 2, async (value) => {
      active += 1
      maxActive = Math.max(maxActive, active)
      await new Promise((resolve) => setTimeout(resolve, 2))
      active -= 1
      return value * 2
    })

    expect(values).toEqual([0, 2, 4, 6, 8])
    expect(maxActive).toBe(2)
  })

  test('returns live stats on the first page without repeating the group query on appended pages', async () => {
    const loadStats = vi.fn(async () => ({ total: 12, bySource: { X: 12 } }))
    const handler = createPaginatedRouteHandler({
      context: '/api/content/paginated',
      loadPage: vi.fn(async (query) => ({
        items: [], page: query.page, pageSize: query.pageSize, total: 12, totalPages: 2, hasMore: query.page === 1,
      })),
      loadStats,
    })

    const first = await handler(new NextRequest('http://localhost/api/content/paginated?page=1&pageSize=6&orderBy=createdAt'))
    expect(await first.json()).toMatchObject({ success: true, stats: { total: 12, bySource: { X: 12 } } })
    const second = await handler(new NextRequest('http://localhost/api/content/paginated?page=2&pageSize=6&orderBy=createdAt'))
    expect(await second.json()).not.toHaveProperty('stats')
    expect(loadStats).toHaveBeenCalledTimes(1)
  })
})
