'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check } from '@/components/Icon'

const BASE_URL = 'https://ca.kedaya.xyz'

export default function ApiDocsPage() {
  const [copied, setCopied] = useState(false)

  const copyMarkdown = () => {
    const markdown = generateMarkdown()
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-black tracking-tight">API 文档</h1>
              <p className="text-gray-600 mt-2">Content Analyzer RESTful API 接口说明</p>
            </div>

            <button
              onClick={copyMarkdown}
              className="flex items-center gap-2 px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  复制 Markdown
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
        {/* 认证说明 */}
        <Section title="认证">
          <p className="text-gray-600 mb-4">
            系统使用 JWT Cookie 鉴权。除 <span className="font-mono">/login</span> 与{' '}
            <span className="font-mono">/api/auth/login</span> 外，所有页面与 API 都需要携带{' '}
            <span className="font-mono">auth-token</span> Cookie。
          </p>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>重要：</strong> 未登录或 token 无效时：
              <span className="font-mono">/api/*</span> 返回 401 JSON；非 API 页面会跳转到登录页。
            </p>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-black mb-3">登录</h4>
            <CodeBlock>
              {`POST /api/auth/login
Content-Type: application/json

{
  "password": "your-password"
}

响应：
Set-Cookie: auth-token=<jwt-token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800

备注：
- production 环境会附带 Secure
- Next.js 会同时在 response.cookies 与 cookies store 写入（行为一致）`}
            </CodeBlock>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-black mb-3">登出</h4>
            <CodeBlock>{`POST /api/auth/logout`}</CodeBlock>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-black mb-3">使用 Cookie（curl）</h4>
            <CodeBlock>
              {`# 方式 1：直接传 cookie
curl -X POST ${BASE_URL}/api/content \\
  -H "Content-Type: application/json" \\
  -b "auth-token=<your-jwt-token>" \\
  -d '{ ... }'

# 方式 2：保存 cookie 到文件
curl -X POST ${BASE_URL}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -c cookies.txt \\
  -d '{"password":"your-password"}'

curl ${BASE_URL}/api/stats \\
  -b cookies.txt`}
            </CodeBlock>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-black mb-3">未授权响应（统一）</h4>
            <CodeBlock>
              {`HTTP/1.1 401

{
  "success": false,
  "error": {
    "message": "Unauthorized"
  }
}`}
            </CodeBlock>
          </div>
        </Section>

        {/* Base URL */}
        <Section title="Base URL">
          <CodeBlock>{BASE_URL}</CodeBlock>
          <p className="text-sm text-gray-600 mt-3">
            本地开发默认 <span className="font-mono">http://localhost:3000</span>。
          </p>
        </Section>

        {/* 响应格式 */}
        <Section title="响应格式">
          <p className="text-gray-600 mb-4">
            项目存在两类返回格式：
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-black mb-2">1) 统一包装（ApiResponse）</div>
              <p className="text-sm text-gray-600 mb-3">
                常见于：<span className="font-mono">/api/*/paginated</span>、
                <span className="font-mono">/api/auth/login</span>、
                <span className="font-mono">/api/source</span>。
              </p>
              <CodeBlock>
                {`{
  "success": true,
  "data": { ... },
  "pagination": { ... }
}

{
  "success": false,
  "error": {
    "message": "...",
    "code": "..."
  }
}`}
              </CodeBlock>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-black mb-2">2) 直接返回对象（legacy）</div>
              <p className="text-sm text-gray-600 mb-3">
                常见于：<span className="font-mono">/api/content</span>、
                <span className="font-mono">/api/adult-content</span>、
                <span className="font-mono">/api/stats</span>。
              </p>
              <CodeBlock>
                {`{
  "id": "...",
  "source": "X",
  ...
}`}
              </CodeBlock>
            </div>
          </div>
        </Section>

        {/* Agent 调用 */}
        <Section title="Agent 调用">
          <p className="text-gray-600 mb-4">
            Agent 侧推荐直接使用下列接口获取 Markdown 与按日期分页数据。鉴权模式不变，仍使用登录后得到的{' '}
            <span className="font-mono">auth-token</span> Cookie。
          </p>

          <div className="space-y-4">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-black mb-2">1) 单条内容 Markdown</div>
              <CodeBlock>{`GET /api/agent/content/:id/md
GET /api/agent/adult-content/:id/md`}</CodeBlock>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-black mb-2">2) 按日期分页（pageSize 默认 10，最大 10）</div>
              <CodeBlock>
                {`GET /api/agent/content/by-date?date=YYYY-MM-DD&page=1&pageSize=10&includeRaw=1&orderBy=analyzedAt
GET /api/agent/adult-content/by-date?date=YYYY-MM-DD&page=1&pageSize=10&includeRaw=1&orderBy=analyzedAt`}
              </CodeBlock>
            </div>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="text-sm font-semibold text-black mb-2">3) 按日期 Markdown 聚合</div>
              <CodeBlock>
                {`GET /api/agent/content/by-date/md?date=YYYY-MM-DD&page=1&pageSize=10&orderBy=analyzedAt
GET /api/agent/adult-content/by-date/md?date=YYYY-MM-DD&page=1&pageSize=10&orderBy=analyzedAt`}
              </CodeBlock>
            </div>
          </div>
        </Section>

        {/* 端点列表 */}
        <Section title="端点列表">
          <div className="space-y-8">
            {/* 技术内容 */}
            <div className="text-sm font-semibold text-black">技术内容（Content）</div>

            <Endpoint method="POST" path="/api/content" title="创建/更新技术内容" description="按 url 唯一键 upsert：存在则更新，不存在则创建（HTTP 状态仍返回 201）">
              <h4 className="text-sm font-semibold text-black mb-3">请求体</h4>
              <CodeBlock>
                {`{
  "source": "X",                 // 必填：来源（会被 normalize）
  "url": "https://...",          // 必填：原文链接（唯一）
  "title": "标题",               // 可选
  "summary": "内容摘要",         // 必填
  "content": "完整内容",         // 必填
  "score": 8.5,                  // 必填：0-10
  "analyzedBy": "@username"      // 可选
}`}
              </CodeBlock>

              <h4 className="text-sm font-semibold text-black mb-3 mt-6">响应（示例）</h4>
              <CodeBlock>
                {`{
  "id": "clxxx...",
  "source": "X",
  "url": "https://...",
  "title": "标题",
  "summary": "内容摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "@username",
  "analyzedAt": "2026-03-04T01:00:00.000Z",
  "createdAt": "2026-03-04T01:00:00.000Z",
  "updatedAt": "2026-03-04T01:00:00.000Z",
  "favorited": false,
  "favoritedAt": null,
  "mediaUrls": []
}`}
              </CodeBlock>
            </Endpoint>

            <Endpoint method="GET" path="/api/content" title="获取技术内容列表" description="获取内容列表，支持排序；注意该接口可能返回较多数据（推荐使用 paginated 版本）">
              <h4 className="text-sm font-semibold text-black mb-3">查询参数</h4>
              <CodeBlock>{`orderBy=score|createdAt|analyzedAt`}</CodeBlock>
            </Endpoint>

            <Endpoint method="POST" path="/api/content/batch" title="批量创建技术内容" description="请求体为数组，最多 100 条；逐条处理，部分失败不影响其他">
              <CodeBlock>
                {`[
  {
    "source": "X",
    "url": "https://x.com/user/status/123",
    "summary": "摘要",
    "content": "完整内容",
    "score": 8.5
  }
]`}
              </CodeBlock>
            </Endpoint>

            <Endpoint method="GET" path="/api/content/paginated" title="分页获取技术内容" description="统一包装 ApiResponse，携带 pagination 元信息">
              <h4 className="text-sm font-semibold text-black mb-3">查询参数</h4>
              <CodeBlock>{`page=1&pageSize=20&orderBy=score|createdAt|analyzedAt`}</CodeBlock>
              <h4 className="text-sm font-semibold text-black mb-3 mt-6">响应（示例）</h4>
              <CodeBlock>
                {`{
  "success": true,
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 123,
    "totalPages": 7,
    "hasMore": true
  }
}`}
              </CodeBlock>
            </Endpoint>

            <Endpoint method="GET" path="/api/content/[id]" title="获取技术内容详情" description="根据 id 获取单条内容">
              <CodeBlock>{`curl ${BASE_URL}/api/content/<id> -b "auth-token=<token>"`}</CodeBlock>
            </Endpoint>

            <Endpoint method="DELETE" path="/api/content/[id]" title="删除技术内容（幂等）" description="删除不存在的记录也返回 success=true，并用 deleted 标记是否实际删除">
              <CodeBlock>
                {`{
  "success": true,
  "deleted": true
}`}
              </CodeBlock>
            </Endpoint>

            <Endpoint method="POST" path="/api/content/[id]/favorite" title="收藏技术内容" description="标记 favorited=true，并写入 favoritedAt">
              <CodeBlock>{`POST /api/content/[id]/favorite`}</CodeBlock>
            </Endpoint>

            <Endpoint method="DELETE" path="/api/content/[id]/favorite" title="取消收藏技术内容" description="标记 favorited=false，并清空 favoritedAt">
              <CodeBlock>{`DELETE /api/content/[id]/favorite`}</CodeBlock>
            </Endpoint>

            {/* 成人内容 */}
            <div className="text-sm font-semibold text-black pt-4">成人内容（AdultContent）</div>

            <Endpoint method="POST" path="/api/adult-content" title="创建成人内容" description="按 url 唯一键创建；若重复会返回 409">
              <h4 className="text-sm font-semibold text-black mb-3">请求体</h4>
              <CodeBlock>
                {`{
  "source": "X",
  "url": "https://...",
  "title": "标题",
  "summary": "摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "@username"
}`}
              </CodeBlock>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mt-4">
                <p className="text-sm text-yellow-900">
                  <strong>注意：</strong> 成人内容原文抓取默认 prefer defuddle（见 agent by-date 与 source-cache 逻辑）。
                </p>
              </div>
            </Endpoint>

            <Endpoint method="GET" path="/api/adult-content" title="获取成人内容列表" description="获取内容列表，支持排序；注意该接口可能返回较多数据（推荐使用 paginated 版本）">
              <CodeBlock>{`orderBy=score|createdAt|analyzedAt`}</CodeBlock>
            </Endpoint>

            <Endpoint method="POST" path="/api/adult-content/batch" title="批量创建成人内容" description="请求体为数组，最多 100 条；逐条处理，部分失败不影响其他" />

            <Endpoint method="GET" path="/api/adult-content/paginated" title="分页获取成人内容" description="统一包装 ApiResponse，携带 pagination 元信息" />

            <Endpoint method="GET" path="/api/adult-content/[id]" title="获取成人内容详情" description="根据 id 获取单条内容" />

            <Endpoint method="DELETE" path="/api/adult-content/[id]" title="删除成人内容（幂等）" description="删除不存在的记录也返回 success=true，并用 deleted 标记是否实际删除" />

            <Endpoint method="POST" path="/api/adult-content/[id]/favorite" title="收藏成人内容" description="标记 favorited=true，并写入 favoritedAt" />

            <Endpoint method="DELETE" path="/api/adult-content/[id]/favorite" title="取消收藏成人内容" description="标记 favorited=false，并清空 favoritedAt" />

            {/* 媒体与抓取 */}
            <div className="text-sm font-semibold text-black pt-4">媒体与抓取</div>

            <Endpoint
              method="GET"
              path="/api/source"
              title="原文抓取与缓存"
              description="优先 r.jina.ai，失败时 fallback defuddle.md；写入 SourceCache 缓存"
            >
              <h4 className="text-sm font-semibold text-black mb-3">查询参数</h4>
              <CodeBlock>{`url=<encoded-url>&force=1(可选)`}</CodeBlock>
              <h4 className="text-sm font-semibold text-black mb-3 mt-6">响应（示例）</h4>
              <CodeBlock>
                {`{
  "success": true,
  "data": {
    "url": "https://example.com",
    "provider": "jina",
    "status": "ok",
    "title": "...",
    "text": "...",
    "errorText": null,
    "wordCount": 1234,
    "sha256": "...",
    "lastFetchedAt": "2026-03-04T01:00:00.000Z"
  }
}`}
              </CodeBlock>
            </Endpoint>

            <Endpoint
              method="GET"
              path="/api/preview-media"
              title="媒体预览与缓存（仅 X/Twitter）"
              description="仅允许 x.com/twitter.com；会抽取媒体并缓存，可选持久化回填 mediaUrls"
            >
              <h4 className="text-sm font-semibold text-black mb-3">查询参数</h4>
              <CodeBlock>
                {`url=https://x.com/...&force=1(可选)

# 可选持久化（best-effort）
persistKind=content|adultContent
persistId=<cuid>`}
              </CodeBlock>

              <h4 className="text-sm font-semibold text-black mb-3 mt-6">响应（示例）</h4>
              <CodeBlock>
                {`{
  "success": true,
  "url": "https://x.com/...",
  "media": [
    {
      "type": "video",
      "url": "//media.kedaya.xyz/?url=...",
      "fallbackUrl": "...",
      "sourceUrl": "...",
      "expiresAt": 1730000000
    }
  ],
  "videos": [ ... ],
  "images": [ ... ],
  "count": { "videos": 1, "images": 0, "total": 1 }
}`}
              </CodeBlock>
            </Endpoint>

            <Endpoint
              method="POST"
              path="/api/extract-media"
              title="提取 Twitter/X 媒体（legacy）"
              description="支持单 url 或批量 urls（最多 20）"
            >
              <h4 className="text-sm font-semibold text-black mb-3">请求体（单个）</h4>
              <CodeBlock>{`{ "url": "https://x.com/..." }`}</CodeBlock>
              <h4 className="text-sm font-semibold text-black mb-3 mt-6">请求体（批量）</h4>
              <CodeBlock>{`{ "urls": ["https://x.com/...", "https://x.com/..."] }`}</CodeBlock>
            </Endpoint>

            <Endpoint
              method="GET"
              path="/api/media-proxy"
              title="媒体代理（仅 video.twimg.com）"
              description="避免跨域与支持 Range/206；严格 host allowlist，防止变成开放代理"
            >
              <h4 className="text-sm font-semibold text-black mb-3">查询参数</h4>
              <CodeBlock>{`url=<encoded-url>`}</CodeBlock>
              <h4 className="text-sm font-semibold text-black mb-3 mt-6">备注</h4>
              <CodeBlock>{`- 仅允许 hostname=video.twimg.com
- 会透传 range/if-range/etag 等头部`}</CodeBlock>
            </Endpoint>

            {/* 其它 */}
            <div className="text-sm font-semibold text-black pt-4">其它</div>

            <Endpoint method="GET" path="/api/stats" title="获取统计信息" description="返回 total 与按 source 聚合计数（source 已规范化）">
              <CodeBlock>
                {`{
  "total": 30,
  "bySource": {
    "X": 10,
    "Linuxdo": 10,
    "Xiaohongshu": 10
  }
}`}
              </CodeBlock>
            </Endpoint>

            <Endpoint
              method="GET"
              path="/api/preferences/analyze"
              title="收藏偏好分析"
              description="从收藏内容中提取关键词、偏好来源、平均分等"
            >
              <CodeBlock>
                {`{
  "success": true,
  "preferences": {
    "keywords": ["..."] ,
    "avgScore": 8.1,
    "preferredSources": ["X"],
    "contentTypes": { "tech": 12, "adult": 3 },
    "totalFavorites": 15,
    "analyzedAt": "2026-03-04T01:00:00.000Z"
  }
}`}
              </CodeBlock>
            </Endpoint>
          </div>
        </Section>

        {/* 错误响应 */}
        <Section title="错误响应（示例）">
          <div className="space-y-4">
            <ErrorResponse code="400" title="Bad Request">
              {`{
  "error": "Missing required fields: source, url, summary, content, score"
}`}
            </ErrorResponse>

            <ErrorResponse code="401" title="Unauthorized">
              {`{
  "success": false,
  "error": { "message": "Unauthorized" }
}`}
            </ErrorResponse>

            <ErrorResponse code="404" title="Not Found">
              {`{
  "error": "Content not found"
}`}
            </ErrorResponse>

            <ErrorResponse code="409" title="Conflict">
              {`{
  "error": "Content with this URL already exists"
}`}
            </ErrorResponse>

            <ErrorResponse code="500" title="Internal Server Error">
              {`{
  "error": "Failed to create content"
}`}
            </ErrorResponse>
          </div>
        </Section>

        {/* Footer */}
        <div className="text-center py-8 text-sm text-gray-500 border-t border-gray-200">
          Content Analyzer API · Powered by Next.js & Neon PostgreSQL
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-black mb-6">{title}</h2>
      {children}
    </div>
  )
}

function Endpoint({
  method,
  path,
  title,
  description,
  children,
}: {
  method: string
  path: string
  title: string
  description: string
  children?: React.ReactNode
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-blue-100 text-blue-700',
    POST: 'bg-green-100 text-green-700',
    DELETE: 'bg-red-100 text-red-700',
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 text-xs font-bold rounded ${methodColors[method] || ''}`}>
          {method}
        </span>
        <code className="text-sm font-mono text-gray-700">{path}</code>
      </div>
      <h3 className="text-lg font-semibold text-black mb-2">{title}</h3>
      <p className="text-gray-600 mb-6">{description}</p>
      {children}
    </div>
  )
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-x-auto text-xs font-mono text-gray-800">
      {children}
    </pre>
  )
}

function ErrorResponse({
  code,
  title,
  children,
}: {
  code: string
  title: string
  children: string
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="px-3 py-1 text-xs font-bold rounded bg-red-100 text-red-700">{code}</span>
        <span className="text-sm font-semibold text-black">{title}</span>
      </div>
      <CodeBlock>{children}</CodeBlock>
    </div>
  )
}

function generateMarkdown(): string {
  return `# Content Analyzer API 文档

## Base URL

\`\`\`
${BASE_URL}
\`\`\`

## 认证

- 系统使用 JWT Cookie 鉴权，Cookie 名为 \`auth-token\`
- 仅 \`/login\` 与 \`/api/auth/login\` 允许匿名访问
- 未授权访问 \`/api/*\` 会返回 401 JSON（页面路由会跳转登录页）

### 登录

\`\`\`
POST /api/auth/login
Content-Type: application/json

{
  "password": "your-password"
}
\`\`\`

响应：

\`\`\`
Set-Cookie: auth-token=<jwt-token>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800
\`\`\`

备注：production 环境会附带 Secure。

### 登出

\`\`\`
POST /api/auth/logout
\`\`\`

### curl 示例

\`\`\`bash
curl -X POST ${BASE_URL}/api/auth/login \\
  -H "Content-Type: application/json" \\
  -c cookies.txt \\
  -d '{"password":"your-password"}'

curl ${BASE_URL}/api/stats -b cookies.txt
\`\`\`

## Agent 调用

\`\`\`
GET /api/agent/content/:id/md
GET /api/agent/adult-content/:id/md

GET /api/agent/content/by-date?date=YYYY-MM-DD&page=1&pageSize=10&includeRaw=1&orderBy=analyzedAt
GET /api/agent/adult-content/by-date?date=YYYY-MM-DD&page=1&pageSize=10&includeRaw=1&orderBy=analyzedAt

GET /api/agent/content/by-date/md?date=YYYY-MM-DD&page=1&pageSize=10&orderBy=analyzedAt
GET /api/agent/adult-content/by-date/md?date=YYYY-MM-DD&page=1&pageSize=10&orderBy=analyzedAt
\`\`\`

## 端点列表

### 技术内容

- POST \`/api/content\`：按 url upsert（存在则更新，不存在则创建），接口仍返回 201
- GET \`/api/content\`：全量列表（推荐 paginated）
- POST \`/api/content/batch\`：数组，最多 100 条
- GET \`/api/content/paginated\`：统一包装 ApiResponse，包含 pagination
- GET \`/api/content/[id]\`
- DELETE \`/api/content/[id]\`：幂等，返回 \`{success:true, deleted:boolean}\`
- POST \`/api/content/[id]/favorite\`
- DELETE \`/api/content/[id]/favorite\`

### 成人内容

- POST \`/api/adult-content\`：创建；重复 url 返回 409
- GET \`/api/adult-content\`
- POST \`/api/adult-content/batch\`
- GET \`/api/adult-content/paginated\`
- GET \`/api/adult-content/[id]\`
- DELETE \`/api/adult-content/[id]\`
- POST \`/api/adult-content/[id]/favorite\`
- DELETE \`/api/adult-content/[id]/favorite\`

### 媒体与抓取

- GET \`/api/source?url=<encoded>&force=1(可选)\`：原文抓取与缓存（jina 优先，defuddle 备选）
- GET \`/api/preview-media?url=...&force=1(可选)&persistKind=content|adultContent&persistId=...\`：仅允许 x.com/twitter.com
- POST \`/api/extract-media\`：legacy，支持 \`{url}\` 或 \`{urls:[]}\`（最多 20）
- GET \`/api/media-proxy?url=<encoded>\`：仅允许 video.twimg.com

### 其它

- GET \`/api/stats\`：\`{ total, bySource }\`（source 已规范化，如 X/Linuxdo/Xiaohongshu）
- GET \`/api/preferences/analyze\`：收藏偏好分析

## 常见错误（示例）

- 401:
\`\`\`json
{ "success": false, "error": { "message": "Unauthorized" } }
\`\`\`

- 409:
\`\`\`json
{ "error": "Content with this URL already exists" }
\`\`\`
`
}
