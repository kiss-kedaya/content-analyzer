export type ScoreTone = 'high' | 'medium' | 'low' | 'poor'

export function getScoreTone(score: number): ScoreTone {
  if (score >= 8) return 'high'
  if (score >= 6) return 'medium'
  if (score >= 4) return 'low'
  return 'poor'
}

export function getSourceTone(source: string) {
  switch (source.toLowerCase()) {
    case 'x':
    case 'twitter':
      return 'source-x'
    case 'xiaohongshu':
      return 'source-xiaohongshu'
    case 'linuxdo':
      return 'source-linuxdo'
    case 'github':
      return 'source-github'
    default:
      return 'source-default'
  }
}
