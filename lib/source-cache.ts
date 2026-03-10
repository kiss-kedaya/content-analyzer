import crypto from 'crypto'
import { prisma } from './db'
import { normalizeAndValidateHttpUrl } from './url-validate'

export type SourceProvider = 'jina' | 'defuddle'

type FetchResult = {
  provider: SourceProvider
  title?: string
  text: string
  rawResponse?: unknown
}

const FAILED_RETRY_TTL_MS = 15 * 60 * 1000
const inflight = new Map<string, Promise<any>>()

function normalizeUrl(url: string): string {
  const trimmed = url.trim()
  if (!trimmed) throw new Error('Missing url')
  return trimmed
}

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex')
}

function approxWordCount(text: string): number {
  const t = text.trim()
  if (!t) return 0
  // Simple heuristic: split by whitespace. Works ok for EN; for ZH it returns 1.
  // We keep it optional and informational.
  return t.split(/\s+/).filter(Boolean).length
}

async function fetchText(url: string, provider: SourceProvider, timeoutMs = 25000): Promise<FetchResult> {
  const target = provider === 'jina'
    ? `https://r.jina.ai/${url}`
    : `https://defuddle.md/${url}`

  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)

  try {
    const res = await fetch(target, {
      method: 'GET',
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'content-analyzer/1.0 (+openclaw)'
      },
      // Next.js: do not cache at fetch layer; we cache in DB
      cache: 'no-store'
    })

    const text = await res.text()

    if (!res.ok) {
      throw new Error(`${provider} fetch failed: ${res.status}`)
    }

    const cleaned = text.trim()
    if (!cleaned) {
      throw new Error(`${provider} returned empty text`)
    }

    // Light title extraction: defuddle has YAML frontmatter; jina often includes "Title:" line.
    let title: string | undefined
    const jinaTitle = cleaned.match(/^Title:\s*(.+)$/m)?.[1]
    if (jinaTitle) title = jinaTitle.trim()

    return {
      provider,
      title,
      text: cleaned,
      rawResponse: {
        status: res.status,
        contentType: res.headers.get('content-type')
      }
    }
  } finally {
    clearTimeout(timer)
  }
}

export async function getOrFetchSourceText(inputUrl: string, opts?: { force?: boolean }) {
  const url = normalizeAndValidateHttpUrl(normalizeUrl(inputUrl))

  if (!opts?.force) {
    const cached = await prisma.sourceCache.findUnique({ where: { url } })
    if (cached && cached.status === 'ok' && cached.text?.trim()) {
      return cached
    }

    if (cached && cached.status === 'failed' && cached.lastFetchedAt) {
      const last = new Date(cached.lastFetchedAt).getTime()
      if (Date.now() - last < FAILED_RETRY_TTL_MS) {
        return cached
      }
    }
  }

  const existing = inflight.get(url)
  if (existing) return existing

  const task = (async () => {
    const now = new Date()

    // Try jina first
    try {
      const jina = await fetchText(url, 'jina')
      const textSha = sha256(jina.text)
      return await prisma.sourceCache.upsert({
        where: { url },
        create: {
          url,
          provider: 'jina',
          status: 'ok',
          title: jina.title,
          text: jina.text,
          rawResponse: jina.rawResponse as any,
          wordCount: approxWordCount(jina.text),
          sha256: textSha,
          lastFetchedAt: now,
        },
        update: {
          provider: 'jina',
          status: 'ok',
          title: jina.title,
          text: jina.text,
          rawResponse: jina.rawResponse as any,
          wordCount: approxWordCount(jina.text),
          sha256: textSha,
          lastFetchedAt: now,
        }
      })
    } catch (e) {
      // fallback
      try {
        const def = await fetchText(url, 'defuddle')
        const textSha = sha256(def.text)
        return await prisma.sourceCache.upsert({
          where: { url },
          create: {
            url,
            provider: 'defuddle',
            status: 'ok',
            title: def.title,
            text: def.text,
            rawResponse: def.rawResponse as any,
            wordCount: approxWordCount(def.text),
            sha256: textSha,
            lastFetchedAt: now,
          },
          update: {
            provider: 'defuddle',
            status: 'ok',
            title: def.title,
            text: def.text,
            rawResponse: def.rawResponse as any,
            wordCount: approxWordCount(def.text),
            sha256: textSha,
            lastFetchedAt: now,
          }
        })
      } catch (e2) {
        const msg = e2 instanceof Error ? e2.message : String(e2)
        // Save failed state (keep text minimal)
        return await prisma.sourceCache.upsert({
          where: { url },
          create: {
            url,
            provider: 'defuddle',
            status: 'failed',
            text: msg,
            lastFetchedAt: now,
          },
          update: {
            status: 'failed',
            text: msg,
            lastFetchedAt: now,
          }
        })
      }
    }
  })()

  inflight.set(url, task)
  try {
    return await task
  } finally {
    inflight.delete(url)
  }
}
