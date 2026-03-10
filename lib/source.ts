export function normalizeSource(source: string): string {
  const value = (source || '').trim()
  const lower = value.toLowerCase()

  if (lower === 'twitter' || lower === 'x') {
    return 'X'
  }

  return value
}

export function isXSource(source: string): boolean {
  return normalizeSource(source) === 'X'
}
