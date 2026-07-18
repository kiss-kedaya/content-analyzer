import { describe, expect, test } from 'vitest'
import { getSupportedSources, normalizeSource, normalizeSources } from '@/lib/normalize-source'

describe('source normalization', () => {
  test.each([
    ['twitter', 'X'],
    ['Twitter', 'X'],
    ['x', 'X'],
    ['linuxdo', 'Linuxdo'],
    ['LinuxDo', 'Linuxdo'],
    ['xiaohongshu', 'Xiaohongshu'],
    ['小红书', 'Xiaohongshu'],
  ])('normalizes %s to %s', (input, expected) => {
    expect(normalizeSource(input)).toBe(expected)
  })

  test('trims unknown sources and applies stable casing', () => {
    expect(normalizeSource('  CUSTOM  ')).toBe('Custom')
    expect(normalizeSources(['twitter', 'reddit'])).toEqual(['X', 'Reddit'])
  })

  test('lists canonical source names only once', () => {
    const sources = getSupportedSources()
    expect(new Set(sources).size).toBe(sources.length)
    expect(sources).toEqual(expect.arrayContaining(['X', 'Linuxdo', 'Xiaohongshu']))
  })
})
