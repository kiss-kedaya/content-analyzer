'use client'

import { useMemo, useState } from 'react'
import { Download } from '@/components/Icon'
import CopyButton from '@/components/CopyButton'
import PageHeader from '@/components/PageHeader'
import {
  AUTH_COOKIE_NAME,
  BASE_URLS,
  CATEGORIES,
  ENDPOINTS,
  getCurlKit,
  ApiDocCategory,
} from '@/lib/api-doc-spec'

export default function ApiDocsPage() {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({})

  const grouped = useMemo(() => {
    const map: Record<ApiDocCategory, typeof ENDPOINTS> = {
      Auth: [],
      Content: [],
      Adult: [],
      Agent: [],
      Media: [],
      Misc: [],
    }

    for (const item of ENDPOINTS) {
      map[item.category].push(item)
    }

    return map
  }, [])

  const toggle = (id: string) => {
    setOpenIds((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  const allCurl = useMemo(() => getCurlKit({ baseUrl: BASE_URLS.prod }), [])

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <PageHeader
        title="API 文档"
        description="端点说明、curl 示例和 OpenAPI 导出。"
        backHref="/"
        action={<div className="flex flex-wrap gap-2"><a href="/api/openapi.json" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-default bg-surface px-3 text-sm font-semibold text-content hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><Download className="h-4 w-4" />下载 OpenAPI</a><CopyButton text={allCurl} label="复制全部 curl" /></div>}
      />

      <div className="space-y-8">
        <div className="surface-card rounded-2xl p-5 text-sm text-muted">
          <div className="mb-2 font-semibold text-content">鉴权说明</div>
          <ul className="list-disc list-inside space-y-1">
            <li>除 /login 与 /api/auth/login 外，所有接口需要 Cookie：{AUTH_COOKIE_NAME}</li>
            <li>未授权访问 /api/* 返回 401 JSON</li>
            <li>生产环境 base URL：{BASE_URLS.prod}</li>
          </ul>
        </div>

        {CATEGORIES.map((cat) => (
          <section key={cat.id} className="space-y-3">
            <div className="text-sm font-semibold text-content">{cat.label}</div>
            <div className="divide-y divide-[var(--border)] overflow-hidden rounded-2xl border border-default bg-surface">
              {grouped[cat.id].map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={methodBadge(item.method)}>{item.method}</span>
                        <code className="font-mono text-content">{item.path}</code>
                      </div>
                      <div className="mt-1 text-sm text-muted">{item.summary}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton text={item.curl} label="复制 curl" />
                      {(item.details?.query || item.details?.body || item.details?.notes || item.responseExample) && (
                        <button
                          type="button"
                          onClick={() => toggle(item.id)}
                          className="min-h-11 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                          aria-expanded={Boolean(openIds[item.id])}
                        >
                          {openIds[item.id] ? '收起' : '展开'}
                        </button>
                      )}
                    </div>
                  </div>

                  {openIds[item.id] && (
                    <div className="mt-3 space-y-2 text-xs text-muted">
                      {item.details?.query && (
                        <div>
                          <span className="font-semibold text-content">Query：</span>
                          <code className="font-mono">{item.details.query}</code>
                        </div>
                      )}
                      {item.details?.body && (
                        <div>
                          <span className="font-semibold text-content">Body：</span>
                          <code className="font-mono">{item.details.body}</code>
                        </div>
                      )}
                      {item.details?.notes && <div>{item.details.notes}</div>}
                      {item.responseExample && (
                        <pre className="overflow-x-auto rounded-xl border border-default bg-surface-subtle p-3 text-[11px] text-content">
                          {item.responseExample}
                        </pre>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

function methodBadge(method: string) {
  const base = 'rounded-md px-2 py-0.5 text-xs font-semibold'
  if (method === 'GET') return `${base} bg-blue-100 text-blue-700`
  if (method === 'POST') return `${base} bg-green-100 text-green-700`
  if (method === 'DELETE') return `${base} bg-red-100 text-red-700`
  return `${base} bg-surface-raised text-muted`
}
