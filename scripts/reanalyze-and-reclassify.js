const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const prisma = new PrismaClient()

const CONCURRENCY = Number(process.env.CONCURRENCY || 5)

function readArgValue(flag) {
  const idx = process.argv.indexOf(flag)
  if (idx >= 0) {
    const v = process.argv[idx + 1]
    if (v && !String(v).startsWith('-')) return v
  }
  return null
}

function readFirstPositionalNumber() {
  // npm on Windows may append positional args differently; accept a single numeric arg as limit.
  const maybe = process.argv.slice(2).find((x) => /^\d+$/.test(String(x)))
  return maybe ? Number(maybe) : 0
}

const DRY_RUN = process.argv.includes('--dry-run') || process.env.DRY_RUN === '1'
const DEBUG = process.argv.includes('--debug') || process.env.DEBUG === '1'
const DEBUG_AI = process.argv.includes('--debug-ai') || process.env.DEBUG_AI === '1'

const LIMIT = (() => {
  const fromFlag = readArgValue('--limit')
  if (fromFlag) return Number(fromFlag) || 0

  if (process.env.LIMIT) return Number(process.env.LIMIT) || 0

  const fromPositional = readFirstPositionalNumber()
  return Number(fromPositional) || 0
})()

const MIN_TEXT_LEN = Number(process.env.MIN_TEXT_LEN || 120)

const RESTRICTED_KEYWORDS = [
  'Age-restricted adult content',
  'This content might not be appropriate for people under 18 years old',
  "you’ll need to log in",
  'To view this media, you’ll need to log in'
]

function nowIso() {
  return new Date().toISOString()
}

function sha256(text) {
  return crypto.createHash('sha256').update(String(text || ''), 'utf8').digest('hex')
}

function isXStatusUrl(url) {
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (host !== 'x.com' && host !== 'twitter.com' && !host.endsWith('.x.com') && !host.endsWith('.twitter.com')) return false
    const parts = u.pathname.split('/').filter(Boolean)
    return parts.length >= 3 && parts[1] === 'status'
  } catch {
    return false
  }
}

function extractXUsername(url) {
  try {
    const u = new URL(url)
    const parts = u.pathname.split('/').filter(Boolean)
    // /<username>/status/<id>
    if (parts.length >= 3 && parts[1] === 'status') {
      const username = parts[0]
      if (username) return `@${username}`
    }
    return null
  } catch {
    return null
  }
}

function containsRestrictedText(text) {
  const t = String(text || '')
  if (!t) return false
  return RESTRICTED_KEYWORDS.some((kw) => t.includes(kw))
}

async function fetchText(url, options) {
  const controller = new AbortController()
  const timeoutMs = options?.timeoutMs ?? 15000
  const timeout = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36'
      }
    })
    const text = await res.text()
    return { ok: res.ok, status: res.status, text }
  } catch (error) {
    return { ok: false, status: 0, text: '', error }
  } finally {
    clearTimeout(timeout)
  }
}

async function fetchFromJina(originalUrl) {
  const target = `https://r.jina.ai/http://${originalUrl.replace(/^https?:\/\//, '')}`
  const res = await fetchText(target)
  if (!res.ok) {
    return { success: false, provider: 'jina', text: '', status: res.status, retryable: true }
  }

  const text = String(res.text || '').trim()

  // If upstream returns an error page (common for twitter.com), treat as retryable failure.
  const lower = text.toLowerCase()
  const looksLikeErrorPage =
    lower.includes('http error 500') ||
    lower.includes('internal server error') ||
    lower.includes('502 bad gateway') ||
    lower.includes('error 500')

  if (looksLikeErrorPage) {
    return { success: false, provider: 'jina', text: '', status: 500, retryable: true }
  }

  return { success: true, provider: 'jina', text, status: res.status, rawResponse: res.text, retryable: false }
}

function stripYamlFrontmatter(markdown) {
  const s = String(markdown || '')
  if (!s.startsWith('---')) return { title: null, text: s }
  const end = s.indexOf('\n---', 3)
  if (end === -1) return { title: null, text: s }

  const fm = s.slice(3, end).trim()
  const body = s.slice(end + 4).trim()

  // very small YAML parse for title only
  const m = fm.match(/^title:\s*(.*)$/m)
  const title = m ? String(m[1] || '').trim().replace(/^"|"$/g, '') : null
  return { title: title || null, text: body }
}

async function fetchFromDefuddle(originalUrl) {
  const target = `https://defuddle.md/${originalUrl}`
  const res = await fetchText(target)
  if (!res.ok) {
    return { success: false, provider: 'defuddle', text: '', status: res.status }
  }

  const raw = String(res.text || '').trim()
  const parsed = stripYamlFrontmatter(raw)
  const text = String(parsed.text || '').trim()
  const title = parsed.title

  return { success: true, provider: 'defuddle', text, title, status: res.status, rawResponse: raw }
}

async function upsertSourceCache(originalUrl, payload) {
  const text = String(payload.text || '')
  const title = payload.title ? String(payload.title) : null
  const provider = payload.provider
  const digest = sha256(text)

  const status = payload.success ? 'ok' : 'failed'
  const rawResponse = payload.rawResponse ? payload.rawResponse : null

  return prisma.sourceCache.upsert({
    where: { url: originalUrl },
    update: {
      provider,
      status,
      rawResponse,
      title,
      text,
      wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
      sha256: digest,
      lastFetchedAt: new Date(),
    },
    create: {
      url: originalUrl,
      provider,
      status,
      rawResponse,
      title,
      text,
      wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
      sha256: digest,
      lastFetchedAt: new Date(),
    }
  })
}

function buildAiPrompt(text) {
  const clipped = String(text || '').slice(0, 6000)

  return `你是专业的中文内容分析员。请根据输入正文生成标题、摘要并重新评分。\n\n评分体系（总分 0-10，保留 1 位小数）：\n- 信息密度 density: 0-3\n- 可用性/可操作性 actionability: 0-3\n- 可信度线索 credibility: 0-2\n- 表达质量 clarity: 0-2\n总分 = 四项相加。\n\n硬约束：\n- 如果正文主要是登录/注册/年龄限制提示/导航模板等无实际内容，总分封顶 2.0，并在 flags 加入 login_wall 或 adult_restricted。\n- 如果正文为空或过短（<${MIN_TEXT_LEN} 字符）且无法补齐，总分封顶 1.0，并在 flags 加入 too_short。\n\n输出要求：只返回 JSON，不要添加其他文字，不要使用代码块。\n\n请同时判断该内容是否为成人内容（adult/NSFW）。\n- isAdult: boolean\n- adultConfidence: 0-1（越高越确定）\n- adultReason: 简短理由（不超过30字）\n\nJSON 格式：\n{\n  \\\"title\\\": string,\n  \\\"summary\\\": string,\n  \\\"score\\\": number,\n  \\\"score_breakdown\\\": { \\\"density\\\": number, \\\"actionability\\\": number, \\\"credibility\\\": number, \\\"clarity\\\": number },\n  \\\"flags\\\": string[],\n  \\\"isAdult\\\": boolean,\n  \\\"adultConfidence\\\": number,\n  \\\"adultReason\\\": string\n}\n\n正文：\n${clipped}\n`
}

async function callCpaAi(prompt) {
  // CPA local AI endpoint (user requested)
  const baseUrl = 'http://localhost:8317'
  const apiKey = 'sk-codex-proxy-key-1'
  const model = 'gpt-5.2'

  const url = `${baseUrl}/v1/messages`

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      // "anthropic-messages" style (CPA proxy: system messages not allowed)
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
    }),
  })

  if (!res.ok) {
    const errText = await res.text().catch(() => '')
    throw new Error(`CPA AI HTTP ${res.status}: ${errText}`)
  }

  const data = await res.json()

  // Expected: { content: [{type:'text', text:'...'}], ... }
  const text = Array.isArray(data?.content)
    ? data.content.map((c) => (typeof c?.text === 'string' ? c.text : '')).join('\n')
    : (typeof data?.text === 'string' ? data.text : '')

  const raw = String(text || '')

  if (DEBUG_AI) {
    const preview = raw.length > 1200 ? raw.slice(0, 1200) + '\n...[truncated]' : raw
    console.log('\n[debug-ai] raw response (first 1200 chars):')
    console.log(preview)
  }

  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  const jsonStr = jsonMatch ? jsonMatch[0] : raw
  return JSON.parse(jsonStr)
}

function normalizeAiResult(parsed) {
  const title = String(parsed?.title || '').trim()
  const summary = String(parsed?.summary || '').trim()
  const score = Number(parsed?.score)

  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(10, score)) : 0

  const isAdult = Boolean(parsed?.isAdult)
  const adultConfidenceNum = Number(parsed?.adultConfidence)
  const adultConfidence = Number.isFinite(adultConfidenceNum) ? Math.max(0, Math.min(1, adultConfidenceNum)) : 0
  const adultReason = String(parsed?.adultReason || '').trim()

  return {
    title: title || '(无标题)',
    summary: summary || '',
    score: Math.round(safeScore * 10) / 10,
    flags: Array.isArray(parsed?.flags) ? parsed.flags.map(String) : [],
    isAdult,
    adultConfidence,
    adultReason,
  }
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function withRetries(fn, opts) {
  const retries = opts?.retries ?? 3
  let lastErr
  for (let i = 0; i < retries; i++) {
    try {
      return await fn(i + 1)
    } catch (e) {
      lastErr = e
      const delay = Math.min(1000 * Math.pow(2, i), 5000)
      await sleep(delay)
    }
  }
  throw lastErr
}

async function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5)
  const backupDir = path.join(__dirname, '..', 'backups')
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true })

  const file = path.join(backupDir, `backup-reanalyze-${timestamp}.json`)

  const content = await prisma.content.findMany()
  const adultContent = await prisma.adultContent.findMany()
  const sourceCache = await prisma.sourceCache.findMany()

  fs.writeFileSync(
    file,
    JSON.stringify(
      {
        timestamp: nowIso(),
        tables: {
          content: { count: content.length, data: content },
          adultContent: { count: adultContent.length, data: adultContent },
          sourceCache: { count: sourceCache.length, data: sourceCache },
        },
      },
      null,
      2
    )
  )

  return file
}

async function processOne(item) {
  const url = item.url

  // Fetch content using provider policy
  // Step 1: try jina first, and retry on retryable failures (e.g. HTTP ERROR 500 pages)
  const jina = await withRetries(async (attempt) => {
    const r = await fetchFromJina(url)
    if (!r.success && r.retryable) {
      if (DEBUG) {
        console.log(`[debug] jina retryable failure attempt=${attempt} status=${r.status} url=${url}`)
      }
      throw new Error(`jina retryable failure status=${r.status}`)
    }
    return r
  }, { retries: 5 })

  let chosen = jina
  let usedDefuddle = false
  let restricted = false

  const jinaText = String(jina.text || '').trim()
  const jinaTooShort = jina.success && jinaText.length > 0 && jinaText.length < MIN_TEXT_LEN
  const jinaRestricted = jina.success && containsRestrictedText(jinaText)
  const jinaFailed = !jina.success || !jinaText

  // Step 2: fallback to defuddle only when jina truly fails / too short / restricted
  if (jinaFailed || jinaTooShort || jinaRestricted) {
    const def = await withRetries(() => fetchFromDefuddle(url), { retries: 5 })
    chosen = def
    usedDefuddle = true
    restricted = jinaRestricted
  }

  const body = String(chosen.text || '').trim()
  const tooShort = body.length > 0 && body.length < MIN_TEXT_LEN

  // Save SourceCache
  if (!DRY_RUN) {
    await upsertSourceCache(url, chosen)
  }

  // AI analyze
  const prompt = buildAiPrompt(body)
  const aiParsed = await withRetries(() => callCpaAi(prompt), { retries: 5 })
  const ai = normalizeAiResult(aiParsed)

  const username = isXStatusUrl(url) ? extractXUsername(url) : null

  const updates = {
    title: ai.title,
    summary: ai.summary,
    content: body,
    score: ai.score,
    analyzedBy: username || item.analyzedBy || null,
    analyzedAt: new Date(),
  }

  let migrated = false

  const shouldMigrateByAI = item.__table === 'content' && ai.isAdult && ai.adultConfidence >= 0.8

  if (shouldMigrateByAI) {
    migrated = true

    if (!DRY_RUN) {
      await prisma.$transaction(async (tx) => {
        await tx.adultContent.upsert({
          where: { url },
          update: updates,
          create: {
            source: item.source,
            url,
            mediaUrls: Array.isArray(item.mediaUrls) ? item.mediaUrls : [],
            favorited: !!item.favorited,
            favoritedAt: item.favoritedAt || null,
            ...updates,
          },
        })

        await tx.content.deleteMany({ where: { id: item.id } })
      })
    }

    return { ok: true, migrated, provider: chosen.provider, flags: ai.flags, tooShort, isAdult: ai.isAdult, adultConfidence: ai.adultConfidence }
  }

  // Update in-place
  if (!DRY_RUN) {
    if (item.__table === 'content') {
      await prisma.content.update({ where: { id: item.id }, data: updates })
    } else {
      await prisma.adultContent.update({ where: { id: item.id }, data: updates })
    }
  }

  return { ok: true, migrated, provider: chosen.provider, flags: ai.flags, tooShort, isAdult: ai.isAdult, adultConfidence: ai.adultConfidence }
}

async function runPool(items, concurrency) {
  const results = []
  let i = 0
  let done = 0

  const startedAt = Date.now()
  const progressTimer = setInterval(() => {
    const elapsedMs = Date.now() - startedAt
    const perItem = done > 0 ? elapsedMs / done : 0
    const remaining = items.length - done
    const etaMs = perItem * remaining

    const pct = items.length ? ((done / items.length) * 100).toFixed(1) : '0.0'

    console.log(`[progress] ${done}/${items.length} (${pct}%) elapsed=${Math.round(elapsedMs/1000)}s eta=${Math.round(etaMs/1000)}s`)
  }, 3000)

  async function worker(workerId) {
    while (true) {
      const idx = i++
      if (idx >= items.length) return
      const item = items[idx]

      try {
        if (DEBUG) {
          console.log(`[debug] #${idx + 1}/${items.length} table=${item.__table} url=${item.url}`)
        }

        const r = await processOne(item)
        results[idx] = { ok: true, ...r }
      } catch (e) {
        results[idx] = { ok: false, error: e instanceof Error ? e.message : String(e) }
        if (DEBUG) {
          console.log(`[debug] #${idx + 1} failed: ${results[idx].error}`)
        }
      } finally {
        done++
      }
    }
  }

  try {
    const workers = Array.from({ length: concurrency }, (_, n) => worker(n + 1))
    await Promise.all(workers)
    return results
  } finally {
    clearInterval(progressTimer)
  }
}

async function main() {
  console.log(`\n=== Reanalyze + Reclassify Script ===\n`)
  console.log(`dryRun: ${DRY_RUN}`)
  console.log(`concurrency: ${CONCURRENCY}`)
  console.log(`minTextLen: ${MIN_TEXT_LEN}`)

  if (!DRY_RUN) {
    const backupFile = await createBackup()
    console.log(`backup: ${backupFile}`)
  }

  const content = await prisma.content.findMany()
  const adult = await prisma.adultContent.findMany()

  const all = [
    ...content.map((x) => ({ ...x, __table: 'content' })),
    ...adult.map((x) => ({ ...x, __table: 'adultContent' })),
  ]

  const list = LIMIT > 0 ? all.slice(0, LIMIT) : all
  console.log(`total items: ${all.length}, processing: ${list.length}`)

  const startedAt = Date.now()
  const results = await runPool(list, CONCURRENCY)
  const elapsedMs = Date.now() - startedAt

  const ok = results.filter((r) => r && r.ok).length
  const failed = results.length - ok
  const migrated = results.filter((r) => r && r.ok && r.migrated).length
  const defuddle = results.filter((r) => r && r.ok && r.provider === 'defuddle').length
  const jina = results.filter((r) => r && r.ok && r.provider === 'jina').length

  console.log('\n=== Report ===')
  console.log({ ok, failed, migrated, provider: { jina, defuddle }, elapsedMs, avgMs: results.length ? Math.round(elapsedMs / results.length) : 0 })

  if (failed > 0) {
    const sample = results.filter((r) => r && !r.ok).slice(0, 10)
    console.log('\nFailures (sample):')
    console.log(sample)
  }

  await prisma.$disconnect()
}

main().catch(async (e) => {
  console.error(e)
  try { await prisma.$disconnect() } catch {}
  process.exit(1)
})
