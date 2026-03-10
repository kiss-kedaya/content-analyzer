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

export async function getOrFetchSourceText(
  inputUrl: string, 
  opts?: { force?: boolean; preferProvider?: SourceProvider }
) {
  const url = normalizeAndValidateHttpUrl(normalizeUrl(inputUrl))
  const preferProvider = opts?.preferProvider || 'jina'

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

    // Determine provider order based on preference
    const providers: SourceProvider[] = preferProvider === 'defuddle' 
      ? ['defuddle', 'jina'] 
      : ['jina', 'defuddle']

    let lastError: Error | null = null

    // Try providers in order
    for (const provider of providers) {
      try {
        const result = await fetchText(url, provider)
        const textSha = sha256(result.text)
        return await prisma.sourceCache.upsert({
          where: { url },
          create: {
            url,
            provider,
            status: 'ok',
            title: result.title,
            text: result.text,
            rawResponse: result.rawResponse as any,
            wordCount: approxWordCount(result.text),
            sha256: textSha,
            lastFetchedAt: now,
          },
          update: {
            provider,
            status: 'ok',
            title: result.title,
            text: result.text,
            rawResponse: result.rawResponse as any,
            wordCount: approxWordCount(result.text),
            sha256: textSha,
            lastFetchedAt: now,
          }
        })
      } catch (e) {
        lastError = e instanceof Error ? e : new Error(String(e))
        // Continue to next provider
      }
    }

    // All providers failed
    const msg = lastError?.message || 'All providers failed'
    return await prisma.sourceCache.upsert({
      where: { url },
      create: {
        url,
        provider: preferProvider,
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
  })()

  inflight.set(url, task)
  try {
    return await task
  } finally {
    inflight.delete(url)
  }
}
