import { readFile } from 'node:fs/promises'
import { loadEnvFile } from 'node:process'
import { transformXBookmarks, XBookmarksPayload, BookmarkImportItem } from '../lib/x-bookmark-import'

type ImportKind = 'content' | 'adultContent'

function argumentValue(name: string): string | undefined {
  const index = process.argv.indexOf(name)
  return index >= 0 ? process.argv[index + 1] : undefined
}

async function readPayload(file: string): Promise<XBookmarksPayload> {
  const parsed = JSON.parse(await readFile(file, 'utf8')) as XBookmarksPayload
  if (!Array.isArray(parsed.data)) throw new Error('Input must be an X API bookmarks response with a data array')
  return parsed
}

async function login(baseUrl: string, password: string): Promise<string> {
  const response = await fetch(`${baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  })
  if (!response.ok) throw new Error(`Login failed (${response.status})`)

  const setCookie = response.headers.getSetCookie?.()[0] || response.headers.get('set-cookie')
  const cookie = setCookie?.split(';', 1)[0]
  if (!cookie) throw new Error('Login response did not include an auth cookie')
  return cookie
}

async function uploadBatch(baseUrl: string, cookie: string, kind: ImportKind, items: BookmarkImportItem[]) {
  const endpoint = kind === 'content' ? '/api/content/batch' : '/api/adult-content/batch'
  const totals = { success: 0, failed: 0, errors: [] as Array<{ url?: string; error?: string }> }

  for (let offset = 0; offset < items.length; offset += 100) {
    const response = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(items.slice(offset, offset + 100)),
    })
    const result = await response.json() as {
      success?: number
      failed?: number
      errors?: Array<{ url?: string; error?: string }>
      error?: string
    }
    if (!response.ok) throw new Error(result.error || `Upload failed (${response.status})`)
    totals.success += result.success || 0
    totals.failed += result.failed || 0
    totals.errors.push(...(result.errors || []))
  }

  return totals
}

async function main() {
  try {
    loadEnvFile('.env')
  } catch {
    // Environment variables may already be provided by the caller.
  }

  const positional = process.argv.slice(2).filter((value) => !value.startsWith('--'))
  const file = argumentValue('--file') || positional.find((value) => value.endsWith('.json')) || '.local/xapi-bookmarks-50.json'
  const baseUrl = (argumentValue('--base-url') || process.env.CONTENT_ANALYZER_URL || 'https://ca.kedaya.xyz').replace(/\/$/, '')
  const transformed = transformXBookmarks(await readPayload(file))
  const counts = { content: transformed.content.length, adultContent: transformed.adultContent.length }

  if (process.argv.includes('--dry-run') || positional.includes('dry-run')) {
    console.log(JSON.stringify({ dryRun: true, baseUrl, counts }, null, 2))
    return
  }

  const password = process.env.CONTENT_ANALYZER_PASSWORD || process.env.ACCESS_PASSWORD
  if (!password) throw new Error('Set CONTENT_ANALYZER_PASSWORD or ACCESS_PASSWORD')

  const cookie = await login(baseUrl, password)
  const [content, adultContent] = await Promise.all([
    uploadBatch(baseUrl, cookie, 'content', transformed.content),
    uploadBatch(baseUrl, cookie, 'adultContent', transformed.adultContent),
  ])

  console.log(JSON.stringify({ baseUrl, counts, uploaded: { content, adultContent } }, null, 2))
  if (content.failed + adultContent.failed > 0) process.exitCode = 1
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
