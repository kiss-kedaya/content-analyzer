#!/usr/bin/env node

// Replays Snapvid's current two-request browser flow for drift diagnostics.
// It intentionally does not attempt to bypass Cloudflare's managed challenge.

const target = process.argv[2] || 'https://x.com/budingPu/status/2078006193696772377'
const baseUrl = 'https://snapvid.net'

const headers = {
  accept: '*/*',
  'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
  origin: baseUrl,
  referer: `${baseUrl}/en`,
  'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/150 Safari/537.36',
  'x-requested-with': 'XMLHttpRequest',
}

async function post(path, body) {
  const response = await fetch(`${baseUrl}${path}`, { method: 'POST', headers, body })
  const text = await response.text()
  let applicationStatus
  try {
    const parsed = JSON.parse(text)
    applicationStatus = parsed.status || parsed.success || parsed.message || parsed.msg
  } catch {
    applicationStatus = undefined
  }
  return {
    path,
    status: response.status,
    contentType: response.headers.get('content-type'),
    cloudflareMitigation: response.headers.get('cf-mitigated'),
    challengePage: /Just a moment|challenge-platform/i.test(text),
    applicationStatus,
  }
}

async function main() {
  const token = await post('/api/userverify', new URLSearchParams({ url: target }))
  const media = await post('/api/ajaxSearch', new URLSearchParams({
    q: target,
    w: '',
    v: 'v2',
    lang: 'en',
    cftoken: '',
  }))
  console.log(JSON.stringify({ target, token, media }, null, 2))
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
