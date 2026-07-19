import Link from 'next/link'
import { SearchX } from '@/components/Icon'

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] items-center justify-center py-10" aria-labelledby="not-found-heading">
      <div className="surface-card w-full max-w-md rounded-2xl p-6 text-center md:p-8">
        <SearchX className="mx-auto h-12 w-12 text-subtle" aria-hidden="true" />
        <p className="mt-5 text-sm font-semibold tabular-nums text-subtle">404</p>
        <h1 id="not-found-heading" className="mt-1 text-2xl font-semibold tracking-tight text-content">没有找到这个页面</h1>
        <p className="mt-2 text-sm leading-6 text-muted">地址可能已变更，或者对应内容已经被删除。</p>
        <Link href="/" className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-brand px-5 text-sm font-semibold text-[var(--brand-contrast)] hover:bg-[var(--brand-strong)] focus-ring">返回内容列表</Link>
      </div>
    </section>
  )
}
