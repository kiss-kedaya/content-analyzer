import Link from 'next/link'
import { BarChart3, Hash } from '@/components/Icon'
import PageHeader from '@/components/PageHeader'
import { getPreferences } from '@/lib/preferences'
import { formatAppDateTime } from '@/lib/date-format'

export const revalidate = 0

export default async function PreferencesPage() {
  const preferences = await getPreferences()

  return (
    <div className="space-y-8">
      <PageHeader title="收藏统计" description="汇总收藏内容的来源、类型和关键词。" backHref="/favorites" backLabel="返回收藏夹" />

      {!preferences ? (
        <EmptyPreferences />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 md:grid-cols-3">
            <StatCard title="总收藏数" value={preferences.totalFavorites} icon={<BarChart3 className="h-5 w-5" />} />
            <StatCard title="技术内容" value={preferences.contentTypes.tech} icon={<Hash className="h-5 w-5" />} />
            <StatCard title="偏好来源" value={preferences.preferredSources.length} icon={<Hash className="h-5 w-5" />} />
          </section>

          <section className="surface-card rounded-2xl p-5 md:p-7">
            <h2 className="text-lg font-semibold text-content">内容类型分布</h2>
            <div className="mt-5 space-y-5">
              <TypeBar label="技术内容" value={preferences.contentTypes.tech} total={preferences.totalFavorites} />
              <TypeBar label="成人内容" value={preferences.contentTypes.adult} total={preferences.totalFavorites} accent="bg-violet-500" />
            </div>
          </section>

          <section className="surface-card rounded-2xl p-5 md:p-7">
            <h2 className="text-lg font-semibold text-content">偏好来源</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {preferences.preferredSources.map((source) => <span key={source} className="rounded-full bg-surface-raised px-3 py-2 text-sm font-medium text-muted">{source}</span>)}
            </div>
          </section>

          <section className="surface-card rounded-2xl p-5 md:p-7">
            <h2 className="text-lg font-semibold text-content">高频关键词</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {preferences.keywords.map((keyword, index) => <span key={keyword} className="rounded-full border border-default bg-surface-raised px-3 py-1.5 text-sm font-medium text-muted" style={{ fontSize: `${Math.max(.75, 1 - index * .025)}rem` }}>{keyword}</span>)}
            </div>
          </section>

          <p className="text-center text-sm text-subtle">分析时间：{formatAppDateTime(preferences.analyzedAt)}</p>
        </div>
      )}
    </div>
  )
}

function EmptyPreferences() {
  return (
    <section className="surface-card flex min-h-72 flex-col items-center justify-center rounded-2xl p-8 text-center">
      <BarChart3 className="h-11 w-11 text-subtle" aria-hidden="true" />
      <h2 className="mt-4 text-lg font-semibold text-content">暂时没有偏好数据</h2>
      <p className="mt-2 max-w-sm text-sm leading-6 text-muted">收藏一些内容后，系统会在这里呈现来源、类型和常用关键词。</p>
      <Link href="/" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-brand px-4 text-sm font-semibold text-white hover:bg-[var(--brand-strong)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand">浏览内容</Link>
    </section>
  )
}

function StatCard({ title, value, icon }: { title: string; value: number | string; icon: React.ReactNode }) {
  return <div className="surface-card rounded-2xl p-5"><div className="flex items-center justify-between text-muted"><span className="text-sm font-medium">{title}</span><span className="text-brand" aria-hidden="true">{icon}</span></div><div className="mt-5 text-3xl font-bold tabular-nums text-content">{value}</div></div>
}

function TypeBar({ label, value, total, accent = 'bg-brand' }: { label: string; value: number; total: number; accent?: string }) {
  const percentage = total > 0 ? (value / total) * 100 : 0
  return <div><div className="mb-2 flex items-center justify-between gap-3 text-sm"><span className="font-medium text-content">{label}</span><span className="text-muted tabular-nums">{value}（{percentage.toFixed(1)}%）</span></div><div className="h-3 overflow-hidden rounded-full bg-surface-raised"><div className={`h-full rounded-full ${accent}`} style={{ width: `${percentage}%` }} /></div></div>
}
