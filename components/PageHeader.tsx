import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft } from './Icon'

interface PageHeaderProps {
  title: string
  description?: string
  backHref?: string
  backLabel?: string
  action?: ReactNode
}

export default function PageHeader({ title, description, backHref, backLabel = '返回首页', action }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-default pb-5 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {backHref && <Link href={backHref} className="mb-5 inline-flex min-h-11 items-center gap-2 rounded-lg px-2 text-sm font-medium text-muted hover:bg-surface-raised hover:text-content focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><ArrowLeft className="h-4 w-4" aria-hidden="true" />{backLabel}</Link>}
        <h1 className="text-2xl font-semibold tracking-tight text-content md:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm leading-6 text-muted md:text-base">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  )
}
