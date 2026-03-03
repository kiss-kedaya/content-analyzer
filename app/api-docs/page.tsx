import Link from 'next/link'
import { ArrowLeft, Code, AlertCircle, Zap } from '@/components/Icon'

export default function ApiDocsPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          返回首页
        </Link>
        <div className="flex items-center gap-4 mt-6">
          <div className="p-3 bg-black rounded-lg">
            <Code className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-4xl font-bold text-black">
              API 文档
            </h1>
            <p className="text-gray-600 mt-1">
              Content Analyzer API 接口说明
            </p>
          </div>
        </div>
      </div>

      {/* 创建内容 */}
      <ApiSection
        method="POST"
        endpoint="/api/content"
        title="创建内容"
        description="上传新内容到系统"
        gradient="from-blue-500 to-cyan-500"
      >
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-blue-500" />
          请求体
        </h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
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

        <h4 className="font-semibold text-gray-900 mb-3 mt-6 flex items-center gap-2">
          <Zap className="w-4 h-4 text-green-500" />
          响应
        </h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
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

        <h4 className="font-semibold text-gray-900 mb-3 mt-6 flex items-center gap-2">
          <Code className="w-4 h-4 text-purple-500" />
          示例（curl）
        </h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
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

      {/* 批量创建内容 */}
      <ApiSection
        method="POST"
        endpoint="/api/content/batch"
        title="批量创建内容"
        description="一次上传多条内容（最多 100 条）"
        gradient="from-purple-500 to-pink-500"
      >
        <h4 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-500" />
          请求体（数组）
        </h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
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
        </pre>

        <h4 className="font-semibold text-gray-900 mb-3 mt-6 flex items-center gap-2">
          <Zap className="w-4 h-4 text-green-500" />
          响应
        </h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
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
        </pre>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-4">
          <h4 className="font-semibold text-blue-900 mb-2">💡 使用提示</h4>
          <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
            <li>最大批量大小：100 条</li>
            <li>部分失败不影响其他内容创建</li>
            <li>返回详细的成功/失败统计</li>
            <li>适合 OpenClaw Agent 批量上传</li>
          </ul>
        </div>

        <h4 className="font-semibold text-gray-900 mb-3 mt-6 flex items-center gap-2">
          <Code className="w-4 h-4 text-purple-500" />
          CLI 工具
        </h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
{`# 本地上传
npm run upload -- --file data.json

# 生产环境上传
npm run upload -- --file data.json --url https://your-domain.vercel.app

# 查看帮助
npm run upload -- --help`}
        </pre>
      </ApiSection>

      {/* 获取内容列表 */}
      <ApiSection
        method="GET"
        endpoint="/api/content"
        title="获取内容列表"
        description="获取所有内容，支持排序"
        gradient="from-green-500 to-emerald-500"
      >
        <h4 className="font-semibold text-gray-900 mb-3">查询参数</h4>
        <ul className="list-none space-y-2 text-gray-700">
          <li className="flex items-start gap-2 bg-gray-50 p-3 rounded-lg">
            <code className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-semibold">orderBy</code>
            <span className="text-sm">排序字段（score, createdAt, analyzedAt），默认 score</span>
          </li>
        </ul>

        <h4 className="font-semibold text-gray-900 mb-3 mt-6">示例</h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
{`curl https://your-domain.vercel.app/api/content?orderBy=score`}
        </pre>
      </ApiSection>

      {/* 获取内容详情 */}
      <ApiSection
        method="GET"
        endpoint="/api/content/[id]"
        title="获取内容详情"
        description="根据 ID 获取单个内容的完整信息"
        gradient="from-purple-500 to-pink-500"
      >
        <h4 className="font-semibold text-gray-900 mb-3">示例</h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
{`curl https://your-domain.vercel.app/api/content/clxxx...`}
        </pre>
      </ApiSection>

      {/* 删除内容 */}
      <ApiSection
        method="DELETE"
        endpoint="/api/content/[id]"
        title="删除内容"
        description="根据 ID 删除内容"
        gradient="from-red-500 to-pink-500"
      >
        <h4 className="font-semibold text-gray-900 mb-3">响应</h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
{`{
  "success": true
}`}
        </pre>

        <h4 className="font-semibold text-gray-900 mb-3 mt-6">示例</h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
{`curl -X DELETE https://your-domain.vercel.app/api/content/clxxx...`}
        </pre>
      </ApiSection>

      {/* 获取统计信息 */}
      <ApiSection
        method="GET"
        endpoint="/api/stats"
        title="获取统计信息"
        description="获取内容统计数据"
        gradient="from-orange-500 to-amber-500"
      >
        <h4 className="font-semibold text-gray-900 mb-3">响应</h4>
        <pre className="bg-gray-900 text-gray-100 p-5 rounded-xl overflow-x-auto text-sm shadow-lg">
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
      <div className="bg-gradient-to-br from-red-50 to-pink-50 border border-red-200/50 rounded-2xl shadow-lg p-8 hover-lift">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-500 rounded-lg">
            <AlertCircle className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-red-900">错误响应</h2>
        </div>
        <div className="space-y-4">
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-red-200/50">
            <h4 className="font-semibold text-red-800 mb-2">400 Bad Request</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "error": "Missing required fields: source, url, summary, content, score"
}`}
            </pre>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-red-200/50">
            <h4 className="font-semibold text-red-800 mb-2">404 Not Found</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
{`{
  "error": "Content not found"
}`}
            </pre>
          </div>
          <div className="bg-white/60 backdrop-blur-sm rounded-xl p-4 border border-red-200/50">
            <h4 className="font-semibold text-red-800 mb-2">500 Internal Server Error</h4>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg text-xs overflow-x-auto">
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
    <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200/50 p-8 hover-lift">
      <div className="flex items-center gap-4 mb-6">
        <span className={`px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r ${methodColors[method]} text-white shadow-lg`}>
          {method}
        </span>
        <code className="text-base font-mono text-gray-700 bg-gray-100 px-4 py-2 rounded-lg">{endpoint}</code>
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
      <p className="text-gray-600 mb-6">{description}</p>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  )
}
