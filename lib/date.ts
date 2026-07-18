export function getShanghaiDayRange(dateStr: string): { start: Date; end: Date } {
  // dateStr: YYYY-MM-DD
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!m) {
    throw new Error('Invalid date')
  }

  const y = Number(m[1])
  const mo = Number(m[2])
  const d = Number(m[3])

  if (mo < 1 || mo > 12 || d < 1 || d > 31) {
    throw new Error('Invalid date')
  }

  const calendarDate = new Date(Date.UTC(y, mo - 1, d))
  if (
    calendarDate.getUTCFullYear() !== y ||
    calendarDate.getUTCMonth() !== mo - 1 ||
    calendarDate.getUTCDate() !== d
  ) {
    throw new Error('Invalid date')
  }

  // Asia/Shanghai is UTC+8 (no DST). We compute UTC instants for that local day.
  const startUtc = new Date(Date.UTC(y, mo - 1, d, 0 - 8, 0, 0, 0))
  const endUtc = new Date(Date.UTC(y, mo - 1, d + 1, 0 - 8, 0, 0, 0))

  return { start: startUtc, end: endUtc }
}
