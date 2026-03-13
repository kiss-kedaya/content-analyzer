'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Download } from '@/components/Icon'
import CopyButton from '@/components/CopyButton'
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
    <div className="min-h-screen">
      <div className="border-b border-gray-200 bg-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            返回首页
          </Link>

          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-3xl font-bold text-black tracking-tight">API 文档</h1>
              <p className="text-gray-600 mt-2">
                精简模式：端点清单 + 一键复制 curl + OpenAPI 导出
              </p>
            </div>

            <div className="flex items-center gap-2">
              <a
                href="/api/openapi.json"
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md border border-gray-200 text-xs font-medium text-gray-700 hover:text-black hover:border-gray-300 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                下载 openapi.json
              </a>
              <CopyButton text={allCurl} label="复制全部 curl" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-10 space-y-10">
        <div className="rounded-lg border border-gray-200 bg-white p-5 text-sm text-gray-700">
          <div className="font-semibold text-black mb-2">鉴权说明</div>
          <ul className="list-disc list-inside space-y-1">
            <li>除 /login 与 /api/auth/login 外，所有接口需要 Cookie：{AUTH_COOKIE_NAME}</li>
            <li>未授权访问 /api/* 返回 401 JSON</li>
            <li>生产环境 base URL：{BASE_URLS.prod}</li>
          </ul>
        </div>

        {CATEGORIES.map((cat) => (
          <section key={cat.id} className="space-y-3">
            <div className="text-sm font-semibold text-black">{cat.label}</div>
            <div className="divide-y divide-gray-200 border border-gray-200 rounded-lg">
              {grouped[cat.id].map((item) => (
                <div key={item.id} className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm">
                        <span className={methodBadge(item.method)}>{item.method}</span>
                        <code className="font-mono text-gray-800">{item.path}</code>
                      </div>
                      <div className="text-sm text-gray-600 mt-1">{item.summary}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <CopyButton text={item.curl} label="复制 curl" />
                      {(item.details?.query || item.details?.body || item.details?.notes || item.responseExample) && (
                        <button
                          type="button"
                          onClick={() => toggle(item.id)}
                          className="text-xs text-gray-600 hover:text-black"
                        >
                          {openIds[item.id] ? '收起' : '展开'}
                        </button>
                      )}
                    </div>
                  </div>

                  {openIds[item.id] && (
                    <div className="mt-3 space-y-2 text-xs text-gray-600">
                      {item.details?.query && (
                        <div>
                          <span className="font-semibold text-gray-800">Query：</span>
                          <code className="font-mono">{item.details.query}</code>
                        </div>
                      )}
                      {item.details?.body && (
                        <div>
                          <span className="font-semibold text-gray-800">Body：</span>
                          <code className="font-mono">{item.details.body}</code>
                        </div>
                      )}
                      {item.details?.notes && <div>{item.details.notes}</div>}
                      {item.responseExample && (
                        <pre className="bg-gray-50 border border-gray-200 rounded-md p-3 overflow-x-auto text-[11px] text-gray-800">
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
  const base = 'px-2 py-0.5 rounded text-[10px] font-semibold'
  if (method === 'GET') return `${base} bg-blue-100 text-blue-700`
  if (method === 'POST') return `${base} bg-green-100 text-green-700`
  if (method === 'DELETE') return `${base} bg-red-100 text-red-700`
  return `${base} bg-gray-100 text-gray-700`
}
