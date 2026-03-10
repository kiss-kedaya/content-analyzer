import { z } from 'zod'

const MAX_URL_LENGTH = 2000

function isPrivateHostname(hostname: string) {
  const h = hostname.toLowerCase()

  if (h === 'localhost' || h.endsWith('.localhost')) return true
  if (h === '0.0.0.0') return true

  // Block common local domains
  if (h.endsWith('.local') || h.endsWith('.internal')) return true

  return false
}

function isPrivateIp(ip: string): boolean {
  // IPv4 only (good enough for now)
  const m = ip.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/)
  if (!m) return false
  const a = Number(m[1])
  const b = Number(m[2])

  if (a === 10) return true
  if (a === 127) return true
  if (a === 0) return true
  if (a === 169 && b === 254) return true
  if (a === 172 && b >= 16 && b <= 31) return true
  if (a === 192 && b === 168) return true

  return false
}

function looksLikeIpv4(hostname: string): boolean {
  return /^\d+\.\d+\.\d+\.\d+$/.test(hostname)
}

export function normalizeAndValidateHttpUrl(input: string): string {
  const trimmed = (input ?? '').trim()
  if (!trimmed) throw new Error('Missing url')
  if (trimmed.length > MAX_URL_LENGTH) throw new Error('URL too long')

  let u: URL
  try {
    u = new URL(trimmed)
  } catch {
    throw new Error('Invalid url')
  }

  if (u.username || u.password) {
    throw new Error('Credentials in url are not allowed')
  }

  if (u.protocol !== 'http:' && u.protocol !== 'https:') {
    throw new Error('Only http/https are allowed')
  }

  const hostname = u.hostname
  if (!hostname) throw new Error('Invalid host')

  if (isPrivateHostname(hostname)) {
    throw new Error('Private host is not allowed')
  }

  if (looksLikeIpv4(hostname) && isPrivateIp(hostname)) {
    throw new Error('Private ip is not allowed')
  }

  return u.toString()
}

export const HttpUrlSchema = z.string().min(1).max(MAX_URL_LENGTH).transform((v) => normalizeAndValidateHttpUrl(v))
