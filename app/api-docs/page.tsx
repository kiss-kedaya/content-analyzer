'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Copy, Check } from '@/components/Icon'

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
              <h1 className="text-4xl font-bold text-black tracking-tight">
                API 文档
              </h1>
              <p className="text-gray-600 mt-2">
                Content Analyzer RESTful API 接口说明
              </p>
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
            所有 API 请求都需要通过 JWT 认证。请在请求中包含有效的 JWT cookie。
          </p>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-900">
              <strong>⚠️ 重要：</strong> 请先登录系统获取 JWT token，然后在所有 API 请求中自动携带 cookie。
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
Set-Cookie: auth-token=<jwt-token>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800`}
            </CodeBlock>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-black mb-3">使用 JWT Cookie</h4>
            <CodeBlock>
{`# 登录后，cookie 会自动携带在后续请求中
curl -X POST https://ca.kedaya.xyz/api/content \\
  -H "Content-Type: application/json" \\
  -b "auth-token=<your-jwt-token>" \\
  -d '{ ... }'

# 或者使用 -c 和 -b 参数保存和使用 cookie
curl -X POST https://ca.kedaya.xyz/api/auth/login \\
  -H "Content-Type: application/json" \\
  -c cookies.txt \\
  -d '{"password":"your-password"}'

curl -X POST https://ca.kedaya.xyz/api/content \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{ ... }'`}
            </CodeBlock>
          </div>
        </Section>

        {/* Base URL */}
        <Section title="Base URL">
          <CodeBlock>
{`https://ca.kedaya.xyz`}
          </CodeBlock>
        </Section>

        {/* 端点列表 */}
        <Section title="端点列表">
          <div className="space-y-8">
            {/* 创建技术内容 */}
            <Endpoint
              method="POST"
              path="/api/content"
              title="创建技术内容"
              description="上传新的技术内容到系统"
            >
              <h4 className="text-sm font-semibold text-black mb-3">请求体</h4>
              <CodeBlock>
{`{
  "source": "twitter",           // 必填：来源
  "url": "https://...",          // 必填：原文链接（唯一）
  "title": "标题",               // 可选：标题
  "summary": "内容摘要",         // 必填：摘要
  "content": "完整内容",         // 必填：完整内容
  "score": 8.5,                  // 必填：评分（0-10）
  "analyzedBy": "OpenClaw Agent" // 可选：分析者
}`}
              </CodeBlock>

              <h4 className="text-sm font-semibold text-black mb-3 mt-6">响应</h4>
              <CodeBlock>
{`{
  "id": "clxxx...",
  "source": "twitter",
  "url": "https://...",
  "title": "标题",
  "summary": "内容摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "OpenClaw Agent",
  "analyzedAt": "2026-03-04T01:00:00.000Z",
  "createdAt": "2026-03-04T01:00:00.000Z",
  "updatedAt": "2026-03-04T01:00:00.000Z",
  "favorited": false,
  "favoritedAt": null
}`}
              </CodeBlock>

              <h4 className="text-sm font-semibold text-black mb-3 mt-6">示例</h4>
              <CodeBlock>
{`curl -X POST https://ca.kedaya.xyz/api/content \\
  -H "Content-Type: application/json" \\
  -b "auth-token=<your-jwt-token>" \\
  -d '{
    "source": "twitter",
    "url": "https://twitter.com/user/status/123",
    "title": "示例推文",
    "summary": "这是一条示例推文的摘要",
    "content": "这是完整的推文内容...",
    "score": 8.5,
    "analyzedBy": "OpenClaw Agent"
  }'`}
              </CodeBlock>
            </Endpoint>

            {/* 创建成人内容 */}
            <Endpoint
              method="POST"
              path="/api/adult-content"
              title="创建成人内容"
              description="上传新的成人内容到系统"
            >
              <h4 className="text-sm font-semibold text-black mb-3">请求体</h4>
              <CodeBlock>
{`{
  "source": "twitter",
  "url": "https://...",
  "title": "标题",
  "summary": "内容摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "OpenClaw Agent"
}`}
              </CodeBlock>
            </Endpoint>

            {/* 批量创建技术内容 */}
            <Endpoint
              method="POST"
              path="/api/content/batch"
              title="批量创建技术内容"
              description="一次上传多条技术内容（最多 100 条）"
            >
              <h4 className="text-sm font-semibold text-black mb-3">请求体（数组）</h4>
              <CodeBlock>
{`[
  {
    "source": "twitter",
    "url": "https://twitter.com/user/status/123",
    "title": "标题",
    "summary": "摘要",
    "content": "完整内容",
    "score": 8.5,
    "analyzedBy": "OpenClaw Agent"
  },
  {
    "source": "xiaohongshu",
    "url": "https://xiaohongshu.com/...",
    "summary": "摘要",
    "content": "完整内容",
    "score": 7.0
  }
]`}
              </CodeBlock>

              <h4 className="text-sm font-semibold text-black mb-3 mt-6">响应</h4>
              <CodeBlock>
{`{
  "success": 2,
  "failed": 0,
  "total": 2,
  "errors": [],
  "created": [
    {
      "index": 0,
      "id": "clxxx...",
      "url": "https://twitter.com/user/status/123"
    },
    {
      "index": 1,
      "id": "clyyy...",
      "url": "https://xiaohongshu.com/..."
    }
  ]
}`}
              </CodeBlock>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-6">
                <p className="text-sm text-blue-900">
                  <strong>💡 提示：</strong> 最大批量大小为 100 条。部分失败不影响其他内容创建。
                </p>
              </div>
            </Endpoint>

            {/* 批量创建成人内容 */}
            <Endpoint
              method="POST"
              path="/api/adult-content/batch"
              title="批量创建成人内容"
              description="一次上传多条成人内容（最多 100 条）"
            >
              <p className="text-sm text-gray-600">
                请求格式与批量创建技术内容相同。
              </p>
            </Endpoint>

            {/* 获取技术内容列表 */}
            <Endpoint
              method="GET"
              path="/api/content"
              title="获取技术内容列表"
              description="获取所有技术内容，支持排序"
            >
              <h4 className="text-sm font-semibold text-black mb-3">查询参数</h4>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                <code className="text-sm">orderBy</code>
                <span className="text-sm text-gray-600 ml-2">
                  排序字段（score, createdAt, analyzedAt），默认 score
                </span>
              </div>

              <h4 className="text-sm font-semibold text-black mb-3 mt-6">示例</h4>
              <CodeBlock>
{`curl https://ca.kedaya.xyz/api/content?orderBy=score \\
  -b "auth-token=<your-jwt-token>"`}
              </CodeBlock>
            </Endpoint>

            {/* 获取成人内容列表 */}
            <Endpoint
              method="GET"
              path="/api/adult-content"
              title="获取成人内容列表"
              description="获取所有成人内容，支持排序"
            >
              <h4 className="text-sm font-semibold text-black mb-3">示例</h4>
              <CodeBlock>
{`curl https://ca.kedaya.xyz/api/adult-content?orderBy=score \\
  -b "auth-token=<your-jwt-token>"`}
              </CodeBlock>
            </Endpoint>

            {/* 获取内容详情 */}
            <Endpoint
              method="GET"
              path="/api/content/[id]"
              title="获取内容详情"
              description="根据 ID 获取单个内容的完整信息"
            >
              <h4 className="text-sm font-semibold text-black mb-3">示例</h4>
              <CodeBlock>
{`curl https://ca.kedaya.xyz/api/content/clxxx... \\
  -b "auth-token=<your-jwt-token>"`}
              </CodeBlock>
            </Endpoint>

            {/* 删除内容 */}
            <Endpoint
              method="DELETE"
              path="/api/content/[id]"
              title="删除内容"
              description="根据 ID 删除内容"
            >
              <h4 className="text-sm font-semibold text-black mb-3">响应</h4>
              <CodeBlock>
{`{
  "success": true
}`}
              </CodeBlock>

              <h4 className="text-sm font-semibold text-black mb-3 mt-6">示例</h4>
              <CodeBlock>
{`curl -X DELETE https://ca.kedaya.xyz/api/content/clxxx... \\
  -b "auth-token=<your-jwt-token>"`}
              </CodeBlock>
            </Endpoint>

            {/* 获取统计信息 */}
            <Endpoint
              method="GET"
              path="/api/stats"
              title="获取统计信息"
              description="获取内容统计数据"
            >
              <h4 className="text-sm font-semibold text-black mb-3">响应</h4>
              <CodeBlock>
{`{
  "total": 30,
  "bySource": {
    "twitter": 10,
    "xiaohongshu": 10,
    "linuxdo": 10
  }
}`}
              </CodeBlock>
            </Endpoint>
          </div>
        </Section>

        {/* 错误响应 */}
        <Section title="错误响应">
          <div className="space-y-4">
            <ErrorResponse code="400" title="Bad Request">
{`{
  "error": "Missing required fields: source, url, summary, content, score"
}`}
            </ErrorResponse>

            <ErrorResponse code="401" title="Unauthorized">
{`{
  "error": "Unauthorized"
}`}
            </ErrorResponse>

            <ErrorResponse code="404" title="Not Found">
{`{
  "error": "Content not found"
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
          Content Analyzer API v1.0 · Powered by Next.js & Neon PostgreSQL
        </div>
      </div>
    </div>
  )
}

function Section({ 
  title, 
  children 
}: { 
  title: string
  children: React.ReactNode 
}) {
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
  children
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
    DELETE: 'bg-red-100 text-red-700'
  }

  return (
    <div className="border border-gray-200 rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 text-xs font-bold rounded ${methodColors[method]}`}>
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
  children 
}: { 
  code: string
  title: string
  children: string 
}) {
  return (
    <div className="border border-gray-200 rounded-lg p-4">
      <div className="flex items-center gap-3 mb-3">
        <span className="px-3 py-1 text-xs font-bold rounded bg-red-100 text-red-700">
          {code}
        </span>
        <span className="text-sm font-semibold text-black">{title}</span>
      </div>
      <CodeBlock>{children}</CodeBlock>
    </div>
  )
}

function generateMarkdown(): string {
  return `# Content Analyzer API 文档

## 认证

所有 API 请求都需要通过 JWT 认证。请在请求中包含有效的 JWT cookie。

### 登录

\`\`\`
POST /api/auth/login
Content-Type: application/json

{
  "password": "your-password"
}

响应：
Set-Cookie: auth-token=<jwt-token>; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=604800
\`\`\`

### 使用 JWT Cookie

\`\`\`bash
# 登录后，cookie 会自动携带在后续请求中
curl -X POST https://ca.kedaya.xyz/api/content \\
  -H "Content-Type: application/json" \\
  -b "auth-token=<your-jwt-token>" \\
  -d '{ ... }'

# 或者使用 -c 和 -b 参数保存和使用 cookie
curl -X POST https://ca.kedaya.xyz/api/auth/login \\
  -H "Content-Type: application/json" \\
  -c cookies.txt \\
  -d '{"password":"your-password"}'

curl -X POST https://ca.kedaya.xyz/api/content \\
  -H "Content-Type: application/json" \\
  -b cookies.txt \\
  -d '{ ... }'
\`\`\`

## Base URL

\`\`\`
https://ca.kedaya.xyz
\`\`\`

## 端点列表

### 1. 创建技术内容

**POST** \`/api/content\`

上传新的技术内容到系统

**请求体**:
\`\`\`json
{
  "source": "twitter",           // 必填：来源
  "url": "https://...",          // 必填：原文链接（唯一）
  "title": "标题",               // 可选：标题
  "summary": "内容摘要",         // 必填：摘要
  "content": "完整内容",         // 必填：完整内容
  "score": 8.5,                  // 必填：评分（0-10）
  "analyzedBy": "OpenClaw Agent" // 可选：分析者
}
\`\`\`

**响应**:
\`\`\`json
{
  "id": "clxxx...",
  "source": "twitter",
  "url": "https://...",
  "title": "标题",
  "summary": "内容摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "OpenClaw Agent",
  "analyzedAt": "2026-03-04T01:00:00.000Z",
  "createdAt": "2026-03-04T01:00:00.000Z",
  "updatedAt": "2026-03-04T01:00:00.000Z",
  "favorited": false,
  "favoritedAt": null
}
\`\`\`

**示例**:
\`\`\`bash
curl -X POST https://ca.kedaya.xyz/api/content \\
  -H "Content-Type: application/json" \\
  -b "auth-token=<your-jwt-token>" \\
  -d '{
    "source": "twitter",
    "url": "https://twitter.com/user/status/123",
    "title": "示例推文",
    "summary": "这是一条示例推文的摘要",
    "content": "这是完整的推文内容...",
    "score": 8.5,
    "analyzedBy": "OpenClaw Agent"
  }'
\`\`\`

---

### 2. 创建成人内容

**POST** \`/api/adult-content\`

上传新的成人内容到系统

**请求体**:
\`\`\`json
{
  "source": "twitter",
  "url": "https://...",
  "title": "标题",
  "summary": "内容摘要",
  "content": "完整内容",
  "score": 8.5,
  "analyzedBy": "OpenClaw Agent"
}
\`\`\`

---

### 3. 批量创建技术内容

**POST** \`/api/content/batch\`

一次上传多条技术内容（最多 100 条）

**请求体（数组）**:
\`\`\`json
[
  {
    "source": "twitter",
    "url": "https://twitter.com/user/status/123",
    "title": "标题",
    "summary": "摘要",
    "content": "完整内容",
    "score": 8.5,
    "analyzedBy": "OpenClaw Agent"
  },
  {
    "source": "xiaohongshu",
    "url": "https://xiaohongshu.com/...",
    "summary": "摘要",
    "content": "完整内容",
    "score": 7.0
  }
]
\`\`\`

**响应**:
\`\`\`json
{
  "success": 2,
  "failed": 0,
  "total": 2,
  "errors": [],
  "created": [
    {
      "index": 0,
      "id": "clxxx...",
      "url": "https://twitter.com/user/status/123"
    },
    {
      "index": 1,
      "id": "clyyy...",
      "url": "https://xiaohongshu.com/..."
    }
  ]
}
\`\`\`

**提示**: 最大批量大小为 100 条。部分失败不影响其他内容创建。

---

### 4. 批量创建成人内容

**POST** \`/api/adult-content/batch\`

一次上传多条成人内容（最多 100 条）

请求格式与批量创建技术内容相同。

---

### 5. 获取技术内容列表

**GET** \`/api/content\`

获取所有技术内容，支持排序

**查询参数**:
- \`orderBy\`: 排序字段（score, createdAt, analyzedAt），默认 score

**示例**:
\`\`\`bash
curl https://ca.kedaya.xyz/api/content?orderBy=score \\
  -b "auth-token=<your-jwt-token>"
\`\`\`

---

### 6. 获取成人内容列表

**GET** \`/api/adult-content\`

获取所有成人内容，支持排序

**示例**:
\`\`\`bash
curl https://ca.kedaya.xyz/api/adult-content?orderBy=score \\
  -b "auth-token=<your-jwt-token>"
\`\`\`

---

### 7. 获取内容详情

**GET** \`/api/content/[id]\`

根据 ID 获取单个内容的完整信息

**示例**:
\`\`\`bash
curl https://ca.kedaya.xyz/api/content/clxxx... \\
  -b "auth-token=<your-jwt-token>"
\`\`\`

---

### 8. 删除内容

**DELETE** \`/api/content/[id]\`

根据 ID 删除内容

**响应**:
\`\`\`json
{
  "success": true
}
\`\`\`

**示例**:
\`\`\`bash
curl -X DELETE https://ca.kedaya.xyz/api/content/clxxx... \\
  -b "auth-token=<your-jwt-token>"
\`\`\`

---

### 9. 获取统计信息

**GET** \`/api/stats\`

获取内容统计数据

**响应**:
\`\`\`json
{
  "total": 30,
  "bySource": {
    "twitter": 10,
    "xiaohongshu": 10,
    "linuxdo": 10
  }
}
\`\`\`

---

## 错误响应

### 400 Bad Request
\`\`\`json
{
  "error": "Missing required fields: source, url, summary, content, score"
}
\`\`\`

### 401 Unauthorized
\`\`\`json
{
  "error": "Unauthorized"
}
\`\`\`

### 404 Not Found
\`\`\`json
{
  "error": "Content not found"
}
\`\`\`

### 500 Internal Server Error
\`\`\`json
{
  "error": "Failed to create content"
}
\`\`\`

---

*Content Analyzer API v1.0 · Powered by Next.js & Neon PostgreSQL*
`
}
