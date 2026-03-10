export function normalizeSource(source: string): string {
  const value = (source || '').trim()
  const lower = value.toLowerCase()

  // 规范化 Twitter/X 相关的来源
  if (lower === 'twitter' || lower === 'x' || lower === 'x.com') {
    return 'X'
  }

  // 规范化 LinuxDo
  if (lower === 'linuxdo') {
    return 'Linuxdo'
  }

  return value
}

export function isXSource(source: string): boolean {
  return normalizeSource(source) === 'X'
}
