/* global chrome */

const DEFAULT_BASE_URL = 'https://ca.kedaya.xyz'
const QUEUE_LIMIT = 500
const BATCH_SIZE = 100
const RETRY_ALARM = 'content-analyzer-upload-retry'

let uploadTimer = null
let uploadPromise = null

async function readStore() {
  const stored = await chrome.storage.local.get(['config', 'queue', 'stats', 'token'])
  return {
    config: { baseUrl: DEFAULT_BASE_URL, enabled: true, ...(stored.config || {}) },
    queue: stored.queue || { data: [], users: {}, media: {} },
    stats: stored.stats || { captured: 0, uploaded: 0, ignored: 0, lastUploadAt: null, lastError: null },
    token: stored.token || '',
  }
}

async function writeStore(values) {
  await chrome.storage.local.set(values)
}

function trimBaseUrl(value) {
  try {
    const url = new URL(String(value || DEFAULT_BASE_URL))
    if (url.protocol !== 'https:' && url.hostname !== 'localhost') throw new Error('HTTPS required')
    return url.origin
  } catch {
    return DEFAULT_BASE_URL
  }
}

function mergePayload(queue, payload) {
  const posts = new Map(queue.data.map((post) => [post.id, post]))
  for (const post of payload.data || []) if (post?.id) posts.set(post.id, post)
  const data = [...posts.values()].slice(-QUEUE_LIMIT)

  const users = { ...queue.users }
  for (const user of payload.includes?.users || []) if (user?.id) users[user.id] = user
  const media = { ...queue.media }
  for (const item of payload.includes?.media || []) if (item?.media_key) media[item.media_key] = item
  return { data, users, media }
}

function payloadForPosts(queue, posts) {
  const authorIds = new Set(posts.map((post) => post.author_id).filter(Boolean))
  const mediaKeys = new Set(posts.flatMap((post) => post.attachments?.media_keys || []))
  return {
    data: posts,
    includes: {
      users: [...authorIds].map((id) => queue.users[id]).filter(Boolean),
      media: [...mediaKeys].map((key) => queue.media[key]).filter(Boolean),
    },
  }
}

async function updateBadge(count, error = false) {
  await chrome.action.setBadgeBackgroundColor({ color: error ? '#dc2626' : '#2563eb' })
  await chrome.action.setBadgeText({ text: count > 0 ? (count > 99 ? '99+' : String(count)) : '' })
}

async function issueToken(config) {
  if (!config.password) throw new Error('请先在插件中保存 Content Analyzer 密码')
  const response = await fetch(`${trimBaseUrl(config.baseUrl)}/api/auth/extension-token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: config.password }),
  })
  const result = await response.json().catch(() => ({}))
  const token = result?.data?.token
  if (!response.ok || !token) throw new Error(result?.error?.message || `登录失败 (${response.status})`)
  await writeStore({ token })
  return token
}

async function sendBatch(config, token, payload) {
  return fetch(`${trimBaseUrl(config.baseUrl)}/api/import/x-timeline`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  })
}

async function uploadPending() {
  if (uploadPromise) return uploadPromise
  uploadPromise = (async () => {
    const state = await readStore()
    if (!state.config.enabled || state.queue.data.length === 0) return { skipped: true }
    if (!state.config.password) {
      state.stats.lastError = '请先设置 Content Analyzer 密码'
      await writeStore({ stats: state.stats })
      await updateBadge(state.queue.data.length, true)
      return { skipped: true }
    }

    const posts = state.queue.data.slice(0, BATCH_SIZE)
    const payload = payloadForPosts(state.queue, posts)
    let token = state.token || await issueToken(state.config)
    let response = await sendBatch(state.config, token, payload)
    if (response.status === 401) {
      await writeStore({ token: '' })
      token = await issueToken(state.config)
      response = await sendBatch(state.config, token, payload)
    }

    const result = await response.json().catch(() => ({}))
    if (!response.ok || result.success !== true) {
      throw new Error(result?.error?.message || result?.errors?.[0]?.error || `上传失败 (${response.status})`)
    }

    const processed = new Set(posts.map((post) => post.id))
    state.queue.data = state.queue.data.filter((post) => !processed.has(post.id))
    state.stats.uploaded += result.imported || 0
    state.stats.ignored += result.ignored || 0
    state.stats.lastUploadAt = new Date().toISOString()
    state.stats.lastError = null
    await writeStore({ queue: state.queue, stats: state.stats, token })
    await updateBadge(state.queue.data.length)

    if (state.queue.data.length > 0) scheduleUpload(250)
    return result
  })().catch(async (error) => {
    const state = await readStore()
    state.stats.lastError = error instanceof Error ? error.message : String(error)
    await writeStore({ stats: state.stats })
    await updateBadge(state.queue.data.length, true)
    throw error
  }).finally(() => {
    uploadPromise = null
  })
  return uploadPromise
}

function scheduleUpload(delay = 3000) {
  if (uploadTimer) clearTimeout(uploadTimer)
  uploadTimer = setTimeout(() => {
    uploadTimer = null
    uploadPending().catch(() => {})
  }, delay)
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  ;(async () => {
    if (message?.type === 'CAPTURE_POSTS') {
      if (!/^https:\/\/(?:x|twitter)\.com\//i.test(sender.url || '')) return { ok: false }
      const state = await readStore()
      const before = state.queue.data.length
      state.queue = mergePayload(state.queue, message.payload || {})
      state.stats.captured += Math.max(0, state.queue.data.length - before)
      await writeStore({ queue: state.queue, stats: state.stats })
      await updateBadge(state.queue.data.length)
      scheduleUpload()
      return { ok: true, pending: state.queue.data.length }
    }

    if (message?.type === 'GET_STATUS') {
      const state = await readStore()
      return {
        config: { baseUrl: state.config.baseUrl, enabled: state.config.enabled, hasPassword: Boolean(state.config.password) },
        pending: state.queue.data.length,
        stats: state.stats,
      }
    }

    if (message?.type === 'SAVE_CONFIG') {
      const state = await readStore()
      state.config = {
        baseUrl: trimBaseUrl(message.config?.baseUrl),
        enabled: message.config?.enabled !== false,
        password: message.config?.password || state.config.password || '',
      }
      await writeStore({ config: state.config, token: message.config?.password ? '' : state.token })
      scheduleUpload(100)
      return { ok: true }
    }

    if (message?.type === 'UPLOAD_NOW') return uploadPending()

    if (message?.type === 'CLEAR_QUEUE') {
      const state = await readStore()
      state.queue = { data: [], users: {}, media: {} }
      state.stats.lastError = null
      await writeStore({ queue: state.queue, stats: state.stats })
      await updateBadge(0)
      return { ok: true }
    }

    return { ok: false }
  })().then(sendResponse).catch((error) => sendResponse({ ok: false, error: error instanceof Error ? error.message : String(error) }))
  return true
})

chrome.alarms.create(RETRY_ALARM, { periodInMinutes: 5 })
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === RETRY_ALARM) uploadPending().catch(() => {})
})
chrome.runtime.onStartup.addListener(() => uploadPending().catch(() => {}))
chrome.runtime.onInstalled.addListener(() => uploadPending().catch(() => {}))
