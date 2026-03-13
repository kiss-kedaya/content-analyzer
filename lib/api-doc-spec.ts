export type ApiDocCategory =
  | 'Auth'
  | 'Content'
  | 'Adult'
  | 'Agent'
  | 'Media'
  | 'Misc'

export type HttpMethod = 'GET' | 'POST' | 'DELETE'

export type ApiDocEndpoint = {
  id: string
  category: ApiDocCategory
  method: HttpMethod
  path: string
  summary: string
  authRequired: boolean
  curl: string
  details?: {
    query?: string
    body?: string
    notes?: string
  }
  responseExample?: string
}

export const BASE_URLS = {
  prod: 'https://ca.kedaya.xyz',
  local: 'http://localhost:3000',
} as const

export const AUTH_COOKIE_NAME = 'auth-token'

export const CATEGORIES: Array<{ id: ApiDocCategory; label: string }> = [
  { id: 'Auth', label: '认证' },
  { id: 'Content', label: '技术内容' },
  { id: 'Adult', label: '成人内容' },
  { id: 'Agent', label: 'Agent 调用' },
  { id: 'Media', label: '媒体与抓取' },
  { id: 'Misc', label: '其它' },
]

function curlHeaderJson() {
  return '-H "Content-Type: application/json"'
}

function curlCookieInline() {
  return `-b "${AUTH_COOKIE_NAME}=<token>"`
}

export const ENDPOINTS: ApiDocEndpoint[] = [
  // Auth
  {
    id: 'auth-login',
    category: 'Auth',
    method: 'POST',
    path: '/api/auth/login',
    summary: '登录并写入 JWT Cookie',
    authRequired: false,
    curl: `curl -X POST ${BASE_URLS.prod}/api/auth/login \\\n  ${curlHeaderJson()} \\\n  -c cookies.txt \\\n  -d '{"password":"your-password"}'`,
    details: {
      body: '{"password":"your-password"}',
      notes: `匿名可访问。成功后 Set-Cookie: ${AUTH_COOKIE_NAME}=...`,
    },
  },
  {
    id: 'auth-logout',
    category: 'Auth',
    method: 'POST',
    path: '/api/auth/logout',
    summary: '登出并删除 Cookie',
    authRequired: true,
    curl: `curl -X POST ${BASE_URLS.prod}/api/auth/logout \\\n  -b cookies.txt`,
  },

  // Content
  {
    id: 'content-create',
    category: 'Content',
    method: 'POST',
    path: '/api/content',
    summary: '创建/更新技术内容（按 url upsert，接口仍返回 201）',
    authRequired: true,
    curl: `curl -X POST ${BASE_URLS.prod}/api/content \\\n  ${curlHeaderJson()} \\\n  ${curlCookieInline()} \\\n  -d '{"source":"X","url":"https://x.com/user/status/123","summary":"...","content":"...","score":8.5}'`,
    details: {
      body: '{"source":"X","url":"...","summary":"...","content":"...","score":8.5,"title":"...","analyzedBy":"..."}',
      notes: 'source 会被 normalize（twitter/Twitter/x 等统一为 X）。',
    },
  },
  {
    id: 'content-list',
    category: 'Content',
    method: 'GET',
    path: '/api/content',
    summary: '获取技术内容列表（全量，推荐 paginated）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/content?orderBy=score" \\\n  ${curlCookieInline()}`,
    details: {
      query: 'orderBy=score|createdAt|analyzedAt',
    },
  },
  {
    id: 'content-batch',
    category: 'Content',
    method: 'POST',
    path: '/api/content/batch',
    summary: '批量创建技术内容（请求体为数组，最多 100 条）',
    authRequired: true,
    curl: `curl -X POST ${BASE_URLS.prod}/api/content/batch \\\n  ${curlHeaderJson()} \\\n  ${curlCookieInline()} \\\n  -d '[{"source":"X","url":"https://x.com/user/status/123","summary":"...","content":"...","score":8.5}]'`,
  },
  {
    id: 'content-paginated',
    category: 'Content',
    method: 'GET',
    path: '/api/content/paginated',
    summary: '分页获取技术内容（ApiResponse 包装）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/content/paginated?page=1&pageSize=20&orderBy=score" \\\n  ${curlCookieInline()}`,
    details: {
      query: 'page=1&pageSize=20&orderBy=score|createdAt|analyzedAt',
    },
  },
  {
    id: 'content-get',
    category: 'Content',
    method: 'GET',
    path: '/api/content/[id]',
    summary: '获取技术内容详情',
    authRequired: true,
    curl: `curl ${BASE_URLS.prod}/api/content/<id> \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'content-delete',
    category: 'Content',
    method: 'DELETE',
    path: '/api/content/[id]',
    summary: '删除技术内容（幂等）',
    authRequired: true,
    curl: `curl -X DELETE ${BASE_URLS.prod}/api/content/<id> \\\n  ${curlCookieInline()}`,
    responseExample: '{"success":true,"deleted":true}',
  },
  {
    id: 'content-fav',
    category: 'Content',
    method: 'POST',
    path: '/api/content/[id]/favorite',
    summary: '收藏技术内容',
    authRequired: true,
    curl: `curl -X POST ${BASE_URLS.prod}/api/content/<id>/favorite \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'content-unfav',
    category: 'Content',
    method: 'DELETE',
    path: '/api/content/[id]/favorite',
    summary: '取消收藏技术内容',
    authRequired: true,
    curl: `curl -X DELETE ${BASE_URLS.prod}/api/content/<id>/favorite \\\n  ${curlCookieInline()}`,
  },

  // Adult
  {
    id: 'adult-create',
    category: 'Adult',
    method: 'POST',
    path: '/api/adult-content',
    summary: '创建成人内容（url 重复会 409）',
    authRequired: true,
    curl: `curl -X POST ${BASE_URLS.prod}/api/adult-content \\\n  ${curlHeaderJson()} \\\n  ${curlCookieInline()} \\\n  -d '{"source":"X","url":"https://x.com/user/status/123","summary":"...","content":"...","score":8.5}'`,
  },
  {
    id: 'adult-list',
    category: 'Adult',
    method: 'GET',
    path: '/api/adult-content',
    summary: '获取成人内容列表（全量，推荐 paginated）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/adult-content?orderBy=score" \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'adult-batch',
    category: 'Adult',
    method: 'POST',
    path: '/api/adult-content/batch',
    summary: '批量创建成人内容（请求体为数组，最多 100 条）',
    authRequired: true,
    curl: `curl -X POST ${BASE_URLS.prod}/api/adult-content/batch \\\n  ${curlHeaderJson()} \\\n  ${curlCookieInline()} \\\n  -d '[{"source":"X","url":"https://x.com/user/status/123","summary":"...","content":"...","score":8.5}]'`,
  },
  {
    id: 'adult-paginated',
    category: 'Adult',
    method: 'GET',
    path: '/api/adult-content/paginated',
    summary: '分页获取成人内容（ApiResponse 包装）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/adult-content/paginated?page=1&pageSize=20&orderBy=score" \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'adult-get',
    category: 'Adult',
    method: 'GET',
    path: '/api/adult-content/[id]',
    summary: '获取成人内容详情',
    authRequired: true,
    curl: `curl ${BASE_URLS.prod}/api/adult-content/<id> \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'adult-delete',
    category: 'Adult',
    method: 'DELETE',
    path: '/api/adult-content/[id]',
    summary: '删除成人内容（幂等）',
    authRequired: true,
    curl: `curl -X DELETE ${BASE_URLS.prod}/api/adult-content/<id> \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'adult-fav',
    category: 'Adult',
    method: 'POST',
    path: '/api/adult-content/[id]/favorite',
    summary: '收藏成人内容',
    authRequired: true,
    curl: `curl -X POST ${BASE_URLS.prod}/api/adult-content/<id>/favorite \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'adult-unfav',
    category: 'Adult',
    method: 'DELETE',
    path: '/api/adult-content/[id]/favorite',
    summary: '取消收藏成人内容',
    authRequired: true,
    curl: `curl -X DELETE ${BASE_URLS.prod}/api/adult-content/<id>/favorite \\\n  ${curlCookieInline()}`,
  },

  // Agent
  {
    id: 'agent-content-md',
    category: 'Agent',
    method: 'GET',
    path: '/api/agent/content/:id/md',
    summary: '单条技术内容 Markdown',
    authRequired: true,
    curl: `curl ${BASE_URLS.prod}/api/agent/content/<id>/md \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'agent-adult-md',
    category: 'Agent',
    method: 'GET',
    path: '/api/agent/adult-content/:id/md',
    summary: '单条成人内容 Markdown',
    authRequired: true,
    curl: `curl ${BASE_URLS.prod}/api/agent/adult-content/<id>/md \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'agent-content-by-date',
    category: 'Agent',
    method: 'GET',
    path: '/api/agent/content/by-date',
    summary: '按日期分页（技术，可 includeRaw）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/agent/content/by-date?date=YYYY-MM-DD&page=1&pageSize=10&includeRaw=1&orderBy=analyzedAt" \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'agent-adult-by-date',
    category: 'Agent',
    method: 'GET',
    path: '/api/agent/adult-content/by-date',
    summary: '按日期分页（成人，可 includeRaw）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/agent/adult-content/by-date?date=YYYY-MM-DD&page=1&pageSize=10&includeRaw=1&orderBy=analyzedAt" \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'agent-content-by-date-md',
    category: 'Agent',
    method: 'GET',
    path: '/api/agent/content/by-date/md',
    summary: '按日期聚合 Markdown（技术）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/agent/content/by-date/md?date=YYYY-MM-DD&page=1&pageSize=10&orderBy=analyzedAt" \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'agent-adult-by-date-md',
    category: 'Agent',
    method: 'GET',
    path: '/api/agent/adult-content/by-date/md',
    summary: '按日期聚合 Markdown（成人）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/agent/adult-content/by-date/md?date=YYYY-MM-DD&page=1&pageSize=10&orderBy=analyzedAt" \\\n  ${curlCookieInline()}`,
  },

  // Media
  {
    id: 'source-fetch',
    category: 'Media',
    method: 'GET',
    path: '/api/source',
    summary: '原文抓取与缓存（jina 优先，defuddle 备选）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/source?url=${encodeURIComponent('https://example.com')}" \\\n  ${curlCookieInline()}`,
    details: {
      query: 'url=<encoded-url>&force=1(可选)',
    },
  },
  {
    id: 'preview-media',
    category: 'Media',
    method: 'GET',
    path: '/api/preview-media',
    summary: '媒体预览与缓存（仅 x.com/twitter.com）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/preview-media?url=${encodeURIComponent('https://x.com/user/status/123')}" \\\n  ${curlCookieInline()}`,
    details: {
      query: 'url=<x/tw-url>&force=1(可选)&persistKind=content|adultContent&persistId=<id>(可选)',
    },
  },
  {
    id: 'extract-media',
    category: 'Media',
    method: 'POST',
    path: '/api/extract-media',
    summary: '提取 Twitter/X 媒体（legacy，单 url 或批量 urls<=20）',
    authRequired: true,
    curl: `curl -X POST ${BASE_URLS.prod}/api/extract-media \\\n  ${curlHeaderJson()} \\\n  ${curlCookieInline()} \\\n  -d '{"url":"https://x.com/user/status/123"}'`,
  },
  {
    id: 'media-proxy',
    category: 'Media',
    method: 'GET',
    path: '/api/media-proxy',
    summary: '媒体代理（仅 video.twimg.com，支持 Range）',
    authRequired: true,
    curl: `curl "${BASE_URLS.prod}/api/media-proxy?url=${encodeURIComponent('https://video.twimg.com/...')}" \\\n  ${curlCookieInline()}`,
  },

  // Misc
  {
    id: 'stats',
    category: 'Misc',
    method: 'GET',
    path: '/api/stats',
    summary: '统计信息（total + bySource）',
    authRequired: true,
    curl: `curl ${BASE_URLS.prod}/api/stats \\\n  ${curlCookieInline()}`,
  },
  {
    id: 'prefs',
    category: 'Misc',
    method: 'GET',
    path: '/api/preferences/analyze',
    summary: '收藏偏好分析（关键词、来源、均分）',
    authRequired: true,
    curl: `curl ${BASE_URLS.prod}/api/preferences/analyze \\\n  ${curlCookieInline()}`,
  },
]

export function getCurlKit(options?: { baseUrl?: string }) {
  const baseUrl = options?.baseUrl || BASE_URLS.prod

  const header = `# Content Analyzer curl kit\n# 1) login -> cookies.txt\n# 2) use cookies.txt for subsequent requests\n\n`
  const login = `curl -X POST ${baseUrl}/api/auth/login \\\n  -H \"Content-Type: application/json\" \\\n  -c cookies.txt \\\n  -d '{\"password\":\"your-password\"}'\n\n`

  const rest = ENDPOINTS
    .filter((e) => e.authRequired)
    .map((e) => `# ${e.method} ${e.path} - ${e.summary}\n${e.curl.replaceAll(BASE_URLS.prod, baseUrl).replaceAll(curlCookieInline(), '-b cookies.txt')}\n`)
    .join('\n')

  return header + login + rest
}
