import { describe, expect, test } from 'vitest'
import { formatAppDate, formatAppDateTime } from '@/lib/date-format'

describe('application date formatting', () => {
  test('uses Shanghai time on both sides of the UTC day boundary', () => {
    const value = '2026-07-18T16:30:45.000Z'
    expect(formatAppDate(value)).toBe('2026/07/19')
    expect(formatAppDateTime(value)).toBe('2026/07/19 00:30:45')
  })
})
