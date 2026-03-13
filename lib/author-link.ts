export type AuthorLink = {
  label: string
  url: string
}

function normalizeHandle(raw: string) {
  return raw.trim().replace(/^@+/, '')
}

export function getAuthorLink(source: string, analyzedBy?: string | null): AuthorLink | null {
  if (!analyzedBy) return null

  const handle = normalizeHandle(analyzedBy)
  if (!handle) return null

  const label = analyzedBy.startsWith('@') ? analyzedBy : `@${handle}`
  const lower = source.trim().toLowerCase()

  if (lower === 'x' || lower === 'twitter') {
    return {
      label,
      url: `https://x.com/${handle}`,
    }
  }

  if (lower === 'linuxdo' || lower === 'linux.do') {
    return {
      label,
      url: `https://linux.do/u/${handle}/summary`,
    }
  }

  return null
}
