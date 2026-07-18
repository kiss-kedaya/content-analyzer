import prisma from './db'

export interface Preferences {
  keywords: string[]
  preferredSources: string[]
  contentTypes: { tech: number; adult: number }
  totalFavorites: number
  analyzedAt: string
}

type FavoriteContent = { summary: string; content: string; source: string }

const MAX_KEYWORD_CHARS_PER_FAVORITE = 6_000
const STOP_WORDS = new Set(['的', '了', '是', '在', '和', '有', '我', '你', '他', 'the', 'a', 'an', 'and', 'or', 'but'])

export async function getPreferences(): Promise<Preferences | null> {
  const [techContents, adultContents] = await Promise.all([
    prisma.content.findMany({
      where: { favorited: true },
      take: 1000,
      select: { summary: true, content: true, source: true },
    }),
    prisma.adultContent.findMany({
      where: { favorited: true },
      take: 1000,
      select: { summary: true, content: true, source: true },
    }),
  ])
  const allFavorites = [...techContents, ...adultContents]
  if (allFavorites.length === 0) return null

  return {
    keywords: extractKeywords(allFavorites),
    preferredSources: [...new Set(allFavorites.map((content) => content.source))],
    contentTypes: { tech: techContents.length, adult: adultContents.length },
    totalFavorites: allFavorites.length,
    analyzedAt: new Date().toISOString(),
  }
}

export function extractKeywords(contents: FavoriteContent[]): string[] {
  const counts = new Map<string, number>()

  for (const content of contents) {
    // Do not build one giant string for every favorite. The beginning of a
    // captured article contains its useful keywords, while the cap bounds heap use.
    const summary = content.summary.slice(0, MAX_KEYWORD_CHARS_PER_FAVORITE)
    const remaining = MAX_KEYWORD_CHARS_PER_FAVORITE - summary.length - 1
    const text = remaining > 0
      ? `${summary} ${content.content.slice(0, remaining)}`
      : summary
    const words = text
      .toLowerCase()
      .replace(/[^\u4e00-\u9fa5a-z0-9\s]/g, ' ')
      .split(/\s+/)

    for (const word of words) {
      if (word.length <= 2 || STOP_WORDS.has(word)) continue
      counts.set(word, (counts.get(word) || 0) + 1)
    }
  }

  return [...counts.entries()]
    .sort(([, left], [, right]) => right - left)
    .map(([word]) => word)
    .slice(0, 20)
}
