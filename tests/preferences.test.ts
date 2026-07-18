import { describe, expect, test } from 'vitest'
import { extractKeywords } from '@/lib/preferences'

describe('preference keyword extraction', () => {
  test('counts useful terms without retaining the full favorite corpus', () => {
    const longContent = `${'x '.repeat(3_100)}tailword tailword`
    const keywords = extractKeywords([
      { summary: 'Alpha alpha', content: `${longContent} alpha`, score: 8, source: 'X' },
      { summary: 'Alpha beta', content: 'beta beta the and', score: 9, source: 'Linuxdo' },
    ])

    expect(keywords.slice(0, 2)).toEqual(['alpha', 'beta'])
    expect(keywords).not.toContain('tailword')
    expect(keywords).not.toContain('the')
  })
})
