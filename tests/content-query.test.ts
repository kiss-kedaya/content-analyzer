import { describe, expect, test } from 'vitest'
import { buildContentWhere, getStoredContentFields } from '@/lib/content-api-factory'
import { getShanghaiDayRange } from '@/lib/date'
import { ContentListQuerySchema } from '@/lib/validation'

describe('content list query filters', () => {
  test('stores original text and disables legacy score generation', () => {
    expect(getStoredContentFields({ content: 'original post text' })).toEqual({
      summary: 'original post text',
      content: 'original post text',
      score: 0,
    })
  })

  test('returns no where clause when no optional filters are active', () => {
    expect(buildContentWhere()).toBeUndefined()
  })

  test('matches only title, summary, and source for a search query', () => {
    expect(buildContentWhere({ q: 'Agent' })).toEqual({
      OR: [
        { title: { contains: 'Agent', mode: 'insensitive' } },
        { summary: { contains: 'Agent', mode: 'insensitive' } },
        { source: { contains: 'Agent', mode: 'insensitive' } },
      ],
    })
  })

  test('combines date and search with an AND clause in Shanghai time', () => {
    expect(buildContentWhere({ q: 'X', date: '2026-07-18' })).toEqual({
      AND: [
        {
          createdAt: {
            gte: new Date('2026-07-17T16:00:00.000Z'),
            lt: new Date('2026-07-18T16:00:00.000Z'),
          },
        },
        {
          OR: [
            { title: { contains: 'X', mode: 'insensitive' } },
            { summary: { contains: 'X', mode: 'insensitive' } },
            { source: { contains: 'X', mode: 'insensitive' } },
          ],
        },
      ],
    })
  })

  test('rejects impossible calendar dates', () => {
    expect(() => getShanghaiDayRange('2026-02-30')).toThrow('Invalid date')
    expect(() => getShanghaiDayRange('2026-13-01')).toThrow('Invalid date')
  })

  test('normalizes blank search and rejects impossible request dates', () => {
    expect(ContentListQuerySchema.parse({ page: '1', pageSize: '12', orderBy: 'createdAt', q: '   ' }).q).toBeUndefined()
    expect(ContentListQuerySchema.safeParse({ orderBy: 'score' }).success).toBe(false)
    expect(ContentListQuerySchema.safeParse({ date: '2026-02-30' }).success).toBe(false)
  })
})
