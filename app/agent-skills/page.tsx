'use client'

import CopyButton from '@/components/CopyButton'
import PageHeader from '@/components/PageHeader'
import { AUTH_COOKIE_NAME, BASE_URLS, ENDPOINTS, getCurlKit } from '@/lib/api-doc-spec'

const AGENT_ENDPOINT_IDS = new Set([
  'auth-login',
  'auth-logout',
  'agent-content-md',
  'agent-adult-md',
  'agent-content-by-date',
  'agent-adult-by-date',
  'agent-content-by-date-md',
  'agent-adult-by-date-md',
  'source-fetch',
  'preview-media',
])

export default function AgentSkillsPage() {
  const endpoints = ENDPOINTS.filter((e) => AGENT_ENDPOINT_IDS.has(e.id))
  const kit = getCurlKit({ baseUrl: BASE_URLS.prod })

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader title="自动化接口" description="供脚本调用的常用接口。" backHref="/" action={<CopyButton text={kit} label="复制调用示例" />} />

      <div className="space-y-8">
        <section className="surface-card rounded-2xl p-5 text-sm text-muted">
          <div className="font-semibold text-black mb-2">Agent 快速流程</div>
          <ol className="list-decimal list-inside space-y-1">
            <li>登录获取 Cookie：{AUTH_COOKIE_NAME}</li>
            <li>按日期分页拉取：/api/agent/*/by-date</li>
            <li>Markdown 聚合：/api/agent/*/by-date/md</li>
            <li>原文抓取：/api/source（jina 优先）</li>
            <li>媒体预览：/api/preview-media（可选持久化）</li>
          </ol>
        </section>

        <section className="space-y-3">
          <div className="text-sm font-semibold text-black">核心接口</div>
          <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-default bg-surface">
            {endpoints.map((item) => (
              <div key={item.id} className="p-4">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm">
                      <span className={methodBadge(item.method)}>{item.method}</span>
                      <code className="font-mono text-gray-800">{item.path}</code>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{item.summary}</div>
                    {item.details?.query && (
                      <div className="text-xs text-gray-500 mt-2">
                        Query: <code className="font-mono">{item.details.query}</code>
                      </div>
                    )}
                  </div>
                  <CopyButton text={item.curl} label="复制 curl" />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="surface-card rounded-2xl p-5 text-sm text-muted">
          <div className="font-semibold text-black mb-2">调试提示</div>
          <ul className="list-disc list-inside space-y-1">
            <li>cookie 可保存到 cookies.txt，后续请求用 -b cookies.txt</li>
            <li>分页接口 pageSize 最大 10（Agent by-date）</li>
            <li>媒体接口仅允许 x.com/twitter.com</li>
          </ul>
        </section>
      </div>
    </div>
  )
}

function methodBadge(method: string) {
  const base = 'px-2 py-0.5 rounded text-[10px] font-semibold'
  if (method === 'GET') return `${base} bg-blue-100 text-blue-700`
  if (method === 'POST') return `${base} bg-green-100 text-green-700`
  if (method === 'DELETE') return `${base} bg-red-100 text-red-700`
  return `${base} bg-gray-100 text-gray-700`
}
