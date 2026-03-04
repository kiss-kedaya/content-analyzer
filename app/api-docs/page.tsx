'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Code, AlertCircle, Zap, Copy, Check } from '@/components/Icon'

export default function ApiDocsPage() {
  const [copied, setCopied] = useState(false)

  const copyMarkdown = () => {
    const markdown = generateMarkdown()
    navigator.clipboard.writeText(markdown)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-12 space-y-8">
        {/* Header */}
        <div className="space-y-6">
          <Link 
            href="/" 
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            返回首页
          </Link>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg">
                <Code className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-5xl font-bold bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 bg-clip-text text-transparent">
                  API 文档
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  Content Analyzer RESTful API 接口说明
                </p>
              </div>
            </div>

            {/* Copy Markdown Button */}
            <button
              onClick={copyMarkdown}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transition-all hover:scale-105 font-medium"
            >
              {copied ? (
                <>
                  <Check className="w-5 h-5" />
                  已复制
                </>
              ) : (
                <>
                  <Copy className="w-5 h-5" />
                  复制 Markdown
                </>
              )}
            </button>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-blue-600">8</div>
              <div className="text-sm text-blue-800 mt-1">API 端点</div>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-purple-600">2</div>
              <div className="text-sm text-purple-800 mt-1">内容类型</div>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200/50 rounded-xl p-4">
              <div className="text-3xl font-bold text-green-600">100</div>
              <div className="text-sm text-green-800 mt-1">批量上传限制</div>
            </div>
          </div>
        </div>

        {/* Base URL */}
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center gap-3 mb-3">
            <Zap className="w-5 h-5 text-yellow-400" />
            <h3 className="text-lg font-semibold text-white">Base URL</h3>
          </div>
          <code className="text-cyan-400 text-lg font-mono">https://ca.kedaya.xyz</code>
        </div>

        {/* 创建内容 */}
        <ApiSection
          method="POST"
          endpoint="/api/content"
          title="创建技术内容"
          description="上传新的技术内容到系统"
          gradient="from-blue-500 to-cyan-500"
        >
          <CodeBlock title="请求体" icon="zap" color="blue">
{`{
  "source": "twitter",           // 必填：来源（twitter, xiaohongshu, linuxdo 等）
  "url": "https://...",          // 必填：原文链接（唯一）
  "title": "标题",               // 可选：标题
  "summary": "内容摘要",         // 必填：摘要（50-200字）
  "content": "完整内容",         // 必填：完整内容
  "score": 8.5,                  // 必填：评分（0-10）
  "analyzedBy": "OpenClaw Agent" // 可选：分析者名称
}`}
          </CodeBlock>

          <CodeBlock title="响应" icon="check" color="green">
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

          <CodeBlock title="示例（curl）" icon="code" color="purple">
{`curl -X POST https://ca.kedaya.xyz/api/content \\
  -H "Content-Type: application/json" \\
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
        </ApiSection>

        {/* 创建成人内容 */}
        <ApiSection
          method="POST"
          endpoint="/api/adult-content"
          title="创建成人内容"
          description="上传新的成人内容到系统（支持媒体 URL）"
          gradient="from-pink-500 to-rose-500"
        >
          <CodeBlock title="请求体" icon="zap" color="pink">
{`{
  "source": "twitter",
  "url": "https://...",
  "title": "标题",
  "summary": "内容摘要",
  "content": "完整内容",
  "score": 8.5,
  "mediaUrls": [                 // 可选：媒体 URL 数组
    "https://video.url/1.mp4",
    "https://image.url/1.jpg"
  ],
  "analyzedBy": "OpenClaw Agent"
}`}
          </CodeBlock>
        </ApiSection>

        {/* 批量创建内容 */}
        <ApiSection
          method="POST"
          endpoint="/api/content/batch"
          title="批量创建技术内容"
          description="一次上传多条技术内容（最多 100 条）"
          gradient="from-purple-500 to-indigo-500"
        >
          <CodeBlock title="请求体（数组）" icon="zap" color="purple">
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

          <CodeBlock title="响应" icon="check" color="green">
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

          <InfoBox color="blue" title="💡 使用提示">
            <ul className="space-y-1 list-disc list-inside">
              <li>最大批量大小：100 条</li>
              <li>部分失败不影响其他内容创建</li>
              <li>返回详细的成功/失败统计</li>
              <li>适合 OpenClaw Agent 批量上传</li>
            </ul>
          </InfoBox>

          <CodeBlock title="CLI 工具" icon="code" color="purple">
{`# 本地上传
npm run upload -- --file data.json

# 生产环境上传
npm run upload -- --file data.json --url https://ca.kedaya.xyz

# 查看帮助
npm run upload -- --help`}
          </CodeBlock>
        </ApiSection>

        {/* 批量创建成人内容 */}
        <ApiSection
          method="POST"
          endpoint="/api/adult-content/batch"
          title="批量创建成人内容"
          description="一次上传多条成人内容（最多 100 条）"
          gradient="from-rose-500 to-pink-500"
        >
          <CodeBlock title="请求体（数组）" icon="zap" color="pink">
{`[
  {
    "source": "twitter",
    "url": "https://...",
    "summary": "摘要",
    "content": "完整内容",
    "score": 8.5,
    "mediaUrls": ["https://video.url/1.mp4"]
  }
]`}
          </CodeBlock>
        </ApiSection>

        {/* 获取内容列表 */}
        <ApiSection
          method="GET"
          endpoint="/api/content"
          title="获取技术内容列表"
          description="获取所有技术内容，支持排序"
          gradient="from-green-500 to-emerald-500"
        >
          <InfoBox color="green" title="查询参数">
            <div className="flex items-start gap-2">
              <code className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-sm font-semibold">orderBy</code>
              <span className="text-sm">排序字段（score, createdAt, analyzedAt），默认 score</span>
            </div>
          </InfoBox>

          <CodeBlock title="示例" icon="code" color="green">
{`curl https://ca.kedaya.xyz/api/content?orderBy=score`}
          </CodeBlock>
        </ApiSection>

        {/* 获取成人内容列表 */}
        <ApiSection
          method="GET"
          endpoint="/api/adult-content"
          title="获取成人内容列表"
          description="获取所有成人内容，支持排序"
          gradient="from-pink-500 to-rose-500"
        >
          <CodeBlock title="示例" icon="code" color="pink">
{`curl https://ca.kedaya.xyz/api/adult-content?orderBy=score`}
          </CodeBlock>
        </ApiSection>

        {/* 获取内容详情 */}
        <ApiSection
          method="GET"
          endpoint="/api/content/[id]"
          title="获取内容详情"
          description="根据 ID 获取单个内容的完整信息"
          gradient="from-indigo-500 to-purple-500"
        >
          <CodeBlock title="示例" icon="code" color="indigo">
{`curl https://ca.kedaya.xyz/api/content/clxxx...`}
          </CodeBlock>
        </ApiSection>

        {/* 删除内容 */}
        <ApiSection
          method="DELETE"
          endpoint="/api/content/[id]"
          title="删除内容"
          description="根据 ID 删除内容"
          gradient="from-red-500 to-pink-500"
        >
          <CodeBlock title="响应" icon="check" color="green">
{`{
  "success": true
}`}
          </CodeBlock>

          <CodeBlock title="示例" icon="code" color="red">
{`curl -X DELETE https://ca.kedaya.xyz/api/content/clxxx...`}
          </CodeBlock>
        </ApiSection>

        {/* 获取统计信息 */}
        <ApiSection
          method="GET"
          endpoint="/api/stats"
          title="获取统计信息"
          description="获取内容统计数据"
          gradient="from-orange-500 to-amber-500"
        >
          <CodeBlock title="响应" icon="check" color="orange">
{`{
  "total": 30,
  "bySource": {
    "twitter": 10,
    "xiaohongshu": 10,
    "linuxdo": 10
  }
}`}
          </CodeBlock>
        </ApiSection>

        {/* 错误响应 */}
        <div className="bg-gradient-to-br from-red-50 via-white to-pink-50 border border-red-200/50 rounded-2xl shadow-xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-gradient-to-br from-red-500 to-pink-600 rounded-xl shadow-lg">
              <AlertCircle className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
              错误响应
            </h2>
          </div>
          <div className="space-y-4">
            <ErrorExample code="400" title="Bad Request">
{`{
  "error": "Missing required fields: source, url, summary, content, score"
}`}
            </ErrorExample>
            <ErrorExample code="404" title="Not Found">
{`{
  "error": "Content not found"
}`}
            </ErrorExample>
            <ErrorExample code="500" title="Internal Server Error">
{`{
  "error": "Failed to create content"
}`}
            </ErrorExample>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center py-8 text-gray-500 text-sm">
          <p>Content Analyzer API v1.0 · Powered by Next.js & Neon PostgreSQL</p>
        </div>
      </div>
    </div>
  )
}

function ApiSection({
  method,
  endpoint,
  title,
  description,
  gradient,
  children
}: {
  method: string
  endpoint: string
  title: string
  description: string
  gradient: string
  children: React.ReactNode
}) {
  const methodColors: Record<string, string> = {
    GET: 'from-green-500 to-emerald-500',
    POST: 'from-blue-500 to-cyan-500',
    DELETE: 'from-red-500 to-pink-500'
  }

  return (
    <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl border border-gray-200/50 p-8 hover:shadow-2xl transition-all">
      <div className="flex items-center gap-4 mb-6 flex-wrap">
        <span className={`px-5 py-2.5 text-sm font-bold rounded-xl bg-gradient-to-r ${methodColors[method]} text-white shadow-lg`}>
          {method}
        </span>
        <code className="text-lg font-mono text-gray-700 bg-gradient-to-r from-gray-100 to-gray-50 px-5 py-2.5 rounded-xl border border-gray-200">{endpoint}</code>
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-600 mb-8 text-lg">{description}</p>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}

function CodeBlock({ 
  title, 
  icon, 
  color, 
  children 
}: { 
  title: string
  icon: string
  color: string
  children: string 
}) {
  const iconColors: Record<string, string> = {
    blue: 'text-blue-500',
    green: 'text-green-500',
    purple: 'text-purple-500',
    pink: 'text-pink-500',
    red: 'text-red-500',
    orange: 'text-orange-500',
    indigo: 'text-indigo-500'
  }

  const Icon = icon === 'zap' ? Zap : icon === 'check' ? Check : Code

  return (
    <div>
      <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2 text-lg">
        <Icon className={`w-5 h-5 ${iconColors[color]}`} />
        {title}
      </h4>
      <pre className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-6 rounded-xl overflow-x-auto text-sm shadow-xl border border-gray-700">
        {children}
      </pre>
    </div>
  )
}

function InfoBox({ 
  color, 
  title, 
  children 
}: { 
  color: string
  title: string
  children: React.ReactNode 
}) {
  const colors: Record<string, { bg: string, border: string, text: string }> = {
    blue: { bg: 'from-blue-50 to-cyan-50', border: 'border-blue-200/50', text: 'text-blue-900' },
    green: { bg: 'from-green-50 to-emerald-50', border: 'border-green-200/50', text: 'text-green-900' },
    pink: { bg: 'from-pink-50 to-rose-50', border: 'border-pink-200/50', text: 'text-pink-900' }
  }

  return (
    <div className={`bg-gradient-to-br ${colors[color].bg} border ${colors[color].border} rounded-xl p-5 shadow-lg`}>
      <h4 className={`font-semibold ${colors[color].text} mb-3 text-lg`}>{title}</h4>
      <div className={`text-sm ${colors[color].text}`}>
        {children}
      </div>
    </div>
  )
}

function ErrorExample({ 
  code, 
  title, 
  children 
}: { 
  code: string
  title: string
  children: string 
}) {
  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-xl p-5 border border-red-200/50 shadow-lg">
      <div className="flex items-center gap-3 mb-3">
        <span className="px-3 py-1 bg-red-500 text-white text-sm font-bold rounded-lg">{code}</span>
        <h4 className="font-semibold text-red-800">{title}</h4>
      </div>
      <pre className="bg-gradient-to-br from-gray-900 to-gray-800 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto border border-gray-700">
        {children}
      </pre>
    </div>
  )
}

function generateMarkdown(): string {
  return `# Content Analyzer API 文档

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
  "source": "twitter",           // 必填：来源（twitter, xiaohongshu, linuxdo 等）
  "url": "https://...",          // 必填：原文链接（唯一）
  "title": "标题",               // 可选：标题
  "summary": "内容摘要",         // 必填：摘要（50-200字）
  "content": "完整内容",         // 必填：完整内容
  "score": 8.5,                  // 必填：评分（0-10）
  "analyzedBy": "OpenClaw Agent" // 可选：分析者名称
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

**示例（curl）**:
\`\`\`bash
curl -X POST https://ca.kedaya.xyz/api/content \\
  -H "Content-Type: application/json" \\
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

上传新的成人内容到系统（支持媒体 URL）

**请求体**:
\`\`\`json
{
  "source": "twitter",
  "url": "https://...",
  "title": "标题",
  "summary": "内容摘要",
  "content": "完整内容",
  "score": 8.5,
  "mediaUrls": [                 // 可选：媒体 URL 数组
    "https://video.url/1.mp4",
    "https://image.url/1.jpg"
  ],
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

**使用提示**:
- 最大批量大小：100 条
- 部分失败不影响其他内容创建
- 返回详细的成功/失败统计
- 适合 OpenClaw Agent 批量上传

**CLI 工具**:
\`\`\`bash
# 本地上传
npm run upload -- --file data.json

# 生产环境上传
npm run upload -- --file data.json --url https://ca.kedaya.xyz

# 查看帮助
npm run upload -- --help
\`\`\`

---

### 4. 批量创建成人内容
**POST** \`/api/adult-content/batch\`

一次上传多条成人内容（最多 100 条）

---

### 5. 获取技术内容列表
**GET** \`/api/content\`

获取所有技术内容，支持排序

**查询参数**:
- \`orderBy\`: 排序字段（score, createdAt, analyzedAt），默认 score

**示例**:
\`\`\`bash
curl https://ca.kedaya.xyz/api/content?orderBy=score
\`\`\`

---

### 6. 获取成人内容列表
**GET** \`/api/adult-content\`

获取所有成人内容，支持排序

**示例**:
\`\`\`bash
curl https://ca.kedaya.xyz/api/adult-content?orderBy=score
\`\`\`

---

### 7. 获取内容详情
**GET** \`/api/content/[id]\`

根据 ID 获取单个内容的完整信息

**示例**:
\`\`\`bash
curl https://ca.kedaya.xyz/api/content/clxxx...
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
curl -X DELETE https://ca.kedaya.xyz/api/content/clxxx...
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
