const { PrismaClient } = require('@prisma/client')
const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

const prisma = new PrismaClient()

const CONCURRENCY = Number(process.env.CONCURRENCY || 5)
const DRY_RUN = process.argv.includes('--dry-run')
const LIMIT = (() => {
  const idx = process.argv.indexOf('--limit')
  if (idx >= 0) return Number(process.argv[idx + 1] || 0) || 0
  return 0
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
    return { success: false, provider: 'jina', text: '', status: res.status }
  }
  const text = String(res.text || '').trim()
  return { success: true, provider: 'jina', text, status: res.status }
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

  return { success: true, provider: 'defuddle', text, title, status: res.status }
}

async function upsertSourceCache(originalUrl, payload) {
  const text = String(payload.text || '')
  const title = payload.title ? String(payload.title) : null
  const provider = payload.provider
  const digest = sha256(text)

  return prisma.sourceCache.upsert({
    where: { url: originalUrl },
    update: {
      provider,
      status: payload.success ? 'ok' : 'error',
      title,
      text,
      errorText: payload.success ? null : `provider=${provider}, status=${payload.status}`,
      wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
      sha256: digest,
      lastFetchedAt: new Date(),
    },
    create: {
      url: originalUrl,
      provider,
      status: payload.success ? 'ok' : 'error',
      title,
      text,
      errorText: payload.success ? null : `provider=${provider}, status=${payload.status}`,
      wordCount: text ? text.split(/\s+/).filter(Boolean).length : 0,
      sha256: digest,
      lastFetchedAt: new Date(),
    }
  })
}

function buildAiPrompt(text) {
  const clipped = String(text || '').slice(0, 6000)

  return `你是专业的中文内容分析员。请根据输入正文生成标题、摘要并重新评分。\n\n评分体系（总分 0-10，保留 1 位小数）：\n- 信息密度 density: 0-3\n- 可用性/可操作性 actionability: 0-3\n- 可信度线索 credibility: 0-2\n- 表达质量 clarity: 0-2\n总分 = 四项相加。\n\n硬约束：\n- 如果正文主要是登录/注册/年龄限制提示/导航模板等无实际内容，总分封顶 2.0，并在 flags 加入 login_wall 或 adult_restricted。\n- 如果正文为空或过短（<${MIN_TEXT_LEN} 字符）且无法补齐，总分封顶 1.0，并在 flags 加入 too_short。\n\n输出要求：只返回 JSON，不要添加其他文字，不要使用代码块。\nJSON 格式：\n{\n  \\\"title\\\": string,\n  \\\"summary\\\": string,\n  \\\"score\\\": number,\n  \\\"score_breakdown\\\": { \\\"density\\\": number, \\\"actionability\\\": number, \\\"credibility\\\": number, \\\"clarity\\\": number },\n  \\\"flags\\\": string[]\n}\n\n正文：\n${clipped}\n`
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
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  const jsonStr = jsonMatch ? jsonMatch[0] : raw
  return JSON.parse(jsonStr)
}

function normalizeAiResult(parsed) {
  const title = String(parsed?.title || '').trim()
  const summary = String(parsed?.summary || '').trim()
  const score = Number(parsed?.score)

  const safeScore = Number.isFinite(score) ? Math.max(0, Math.min(10, score)) : 0

  return {
    title: title || '(无标题)',
    summary: summary || '',
    score: Math.round(safeScore * 10) / 10,
    flags: Array.isArray(parsed?.flags) ? parsed.flags.map(String) : [],
  }
}

async function withRetries(fn, opts) {
  const retries = opts?.retries ?? 3
  let lastErr
  for (let i = 0; i < retries; i++) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      const delay = Math.min(1000 * Math.pow(2, i), 5000)
      await new Promise((r) => setTimeout(r, delay))
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
  const jina = await withRetries(() => fetchFromJina(url), { retries: 3 })

  let chosen = jina
  let usedDefuddle = false
  let restricted = false

  const jinaText = String(jina.text || '').trim()
  const jinaTooShort = jina.success && jinaText.length > 0 && jinaText.length < MIN_TEXT_LEN
  const jinaRestricted = jina.success && containsRestrictedText(jinaText)
  const jinaFailed = !jina.success || !jinaText

  if (jinaFailed || jinaTooShort || jinaRestricted) {
    const def = await withRetries(() => fetchFromDefuddle(url), { retries: 3 })
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
  const aiParsed = await withRetries(() => callCpaAi(prompt), { retries: 3 })
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

  if (item.__table === 'content' && usedDefuddle && restricted) {
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

    return { ok: true, migrated, provider: chosen.provider, flags: ai.flags, tooShort }
  }

  // Update in-place
  if (!DRY_RUN) {
    if (item.__table === 'content') {
      await prisma.content.update({ where: { id: item.id }, data: updates })
    } else {
      await prisma.adultContent.update({ where: { id: item.id }, data: updates })
    }
  }

  return { ok: true, migrated, provider: chosen.provider, flags: ai.flags, tooShort }
}

async function runPool(items, concurrency) {
  const results = []
  let i = 0

  async function worker() {
    while (true) {
      const idx = i++
      if (idx >= items.length) return
      const item = items[idx]

      try {
        const r = await processOne(item)
        results[idx] = { ok: true, ...r }
      } catch (e) {
        results[idx] = { ok: false, error: e instanceof Error ? e.message : String(e) }
      }
    }
  }

  const workers = Array.from({ length: concurrency }, () => worker())
  await Promise.all(workers)
  return results
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
