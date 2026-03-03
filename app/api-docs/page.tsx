import Link from 'next/link'

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link href="/" className="text-blue-600 hover:underline">
          ← 返回首页
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mt-4">API 文档</h1>
        <p className="text-gray-600 mt-2">
          Content Analyzer API 接口说明
        </p>
      </div>

      {/* 创建内容 */}
      <ApiSection
        method="POST"
        endpoint="/api/content"
        title="创建内容"
        description="上传新内容到系统"
      >
        <h4 className="font-semibold text-gray-900 mb-2">请求体</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "source": "twitter",           // 必填：来源（twitter, xiaohongshu, linuxdo 等）
  "url": "https://...",          // 必填：原文链接（唯一）
  "title": "标题",               // 可选：标题
  "summary": "内容摘要",         // 必填：摘要（50-200字）
  "content": "完整内容",         // 必填：完整内容
  "score": 8.5,                  // 必填：评分（0-10）
  "analyzedBy": "OpenClaw Agent" // 可选：分析者名称
}`}
        </pre>

        <h4 className="font-semibold text-gray-900 mb-2 mt-4">响应</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
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
  "updatedAt": "2026-03-04T01:00:00.000Z"
}`}
        </pre>

        <h4 className="font-semibold text-gray-900 mb-2 mt-4">示例（curl）</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X POST https://your-domain.vercel.app/api/content \\
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
        </pre>
      </ApiSection>

      {/* 获取内容列表 */}
      <ApiSection
        method="GET"
        endpoint="/api/content"
        title="获取内容列表"
        description="获取所有内容，支持排序"
      >
        <h4 className="font-semibold text-gray-900 mb-2">查询参数</h4>
        <ul className="list-disc list-inside text-gray-700 space-y-1">
          <li><code className="bg-gray-100 px-2 py-0.5 rounded">orderBy</code> - 排序字段（score, createdAt, analyzedAt），默认 score</li>
        </ul>

        <h4 className="font-semibold text-gray-900 mb-2 mt-4">示例</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl https://your-domain.vercel.app/api/content?orderBy=score`}
        </pre>
      </ApiSection>

      {/* 获取内容详情 */}
      <ApiSection
        method="GET"
        endpoint="/api/content/[id]"
        title="获取内容详情"
        description="根据 ID 获取单个内容的完整信息"
      >
        <h4 className="font-semibold text-gray-900 mb-2">示例</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl https://your-domain.vercel.app/api/content/clxxx...`}
        </pre>
      </ApiSection>

      {/* 删除内容 */}
      <ApiSection
        method="DELETE"
        endpoint="/api/content/[id]"
        title="删除内容"
        description="根据 ID 删除内容"
      >
        <h4 className="font-semibold text-gray-900 mb-2">响应</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "success": true
}`}
        </pre>

        <h4 className="font-semibold text-gray-900 mb-2 mt-4">示例</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`curl -X DELETE https://your-domain.vercel.app/api/content/clxxx...`}
        </pre>
      </ApiSection>

      {/* 获取统计信息 */}
      <ApiSection
        method="GET"
        endpoint="/api/stats"
        title="获取统计信息"
        description="获取内容统计数据"
      >
        <h4 className="font-semibold text-gray-900 mb-2">响应</h4>
        <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
{`{
  "total": 30,
  "bySource": {
    "twitter": 10,
    "xiaohongshu": 10,
    "linuxdo": 10
  }
}`}
        </pre>
      </ApiSection>

      {/* 错误响应 */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-red-900 mb-4">错误响应</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h4 className="font-semibold text-red-800">400 Bad Request</h4>
            <pre className="bg-white p-3 rounded border border-red-200 mt-2 text-xs">
{`{
  "error": "Missing required fields: source, url, summary, content, score"
}`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-red-800">404 Not Found</h4>
            <pre className="bg-white p-3 rounded border border-red-200 mt-2 text-xs">
{`{
  "error": "Content not found"
}`}
            </pre>
          </div>
          <div>
            <h4 className="font-semibold text-red-800">500 Internal Server Error</h4>
            <pre className="bg-white p-3 rounded border border-red-200 mt-2 text-xs">
{`{
  "error": "Failed to create content"
}`}
            </pre>
          </div>
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
  children
}: {
  method: string
  endpoint: string
  title: string
  description: string
  children: React.ReactNode
}) {
  const methodColors: Record<string, string> = {
    GET: 'bg-green-100 text-green-800',
    POST: 'bg-blue-100 text-blue-800',
    DELETE: 'bg-red-100 text-red-800'
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-3 mb-4">
        <span className={`px-3 py-1 text-xs font-bold rounded ${methodColors[method]}`}>
          {method}
        </span>
        <code className="text-sm font-mono text-gray-700">{endpoint}</code>
      </div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{description}</p>
      <div className="space-y-4">
        {children}
      </div>
    </div>
  )
}
