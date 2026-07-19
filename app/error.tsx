'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, RefreshCw } from '@/components/Icon'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Application error:', error)
  }, [error])

  return (
    <section className="flex min-h-[60vh] items-center justify-center py-10" aria-labelledby="error-heading">
      <div className="surface-card w-full max-w-md rounded-2xl p-6 text-center md:p-8" role="alert">
        <span className="mx-auto inline-flex h-14 w-14 items-center justify-center rounded-full bg-red-50 text-[var(--danger)]" aria-hidden="true">
          <AlertTriangle className="h-7 w-7" />
        </span>
        <h1 id="error-heading" className="mt-5 text-2xl font-semibold tracking-tight text-content">页面暂时无法显示</h1>
        <p className="mt-2 text-sm leading-6 text-muted">请求没有正常完成。你可以立即重试，或返回内容列表稍后再看。</p>
        {process.env.NODE_ENV === 'development' && (
          <pre className="mt-5 max-h-32 overflow-auto rounded-xl border border-default bg-surface-subtle p-3 text-left text-xs text-muted">{error.message}</pre>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <button type="button" onClick={reset} className="inline-flex min-h-11 items-center justify-center gap-2 rounded-lg bg-brand px-5 text-sm font-semibold text-[var(--brand-contrast)] hover:bg-[var(--brand-strong)] focus-ring">
            <RefreshCw className="h-4 w-4" aria-hidden="true" />重试
          </button>
          <Link href="/" className="inline-flex min-h-11 items-center justify-center rounded-lg border border-default bg-surface px-5 text-sm font-semibold text-content hover:bg-surface-raised focus-ring">返回内容列表</Link>
        </div>
      </div>
    </section>
  )
}
