import { getFavoriteContents } from '@/lib/api'
import { getFavoriteAdultContents } from '@/lib/adult-api'
import Link from 'next/link'
import { Heart, BarChart3 } from '@/components/Icon'
import FavoritesContent from '@/components/FavoritesContent'
import PageHeader from '@/components/PageHeader'

export const revalidate = 0

export default async function FavoritesPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab === 'tech' || params.tab === 'adult' ? params.tab : 'all'
  
  // 获取所有收藏的内容
  const [favoritedTech, favoritedAdult] = await Promise.all([
    getFavoriteContents(),
    getFavoriteAdultContents(),
  ])
  
  const stats = {
    total: favoritedTech.length + favoritedAdult.length,
    tech: favoritedTech.length,
    adult: favoritedAdult.length
  }

  return (
    <div className="space-y-6 md:space-y-8">
      <PageHeader
        title="我的收藏"
        description={`共收藏 ${stats.total} 条内容。`}
        backHref="/"
        action={stats.total > 0 ? <Link href="/preferences" className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-default bg-surface px-4 text-sm font-semibold text-content hover:bg-surface-raised focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"><BarChart3 className="h-4 w-4" />收藏统计</Link> : undefined}
      />

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3 md:gap-6">
        <StatCard title="全部" value={stats.total} active={tab === 'all'} href="/favorites?tab=all" />
        <StatCard title="技术内容" value={stats.tech} active={tab === 'tech'} href="/favorites?tab=tech" />
        <StatCard title="成人内容" value={stats.adult} active={tab === 'adult'} href="/favorites?tab=adult" />
      </div>

      {/* 内容列表 */}
      <FavoritesContent
        techContents={favoritedTech}
        adultContents={favoritedAdult}
        currentTab={tab}
      />
    </div>
  )
}

function StatCard({
  title,
  value,
  active,
  href
}: {
  title: string
  value: number
  active: boolean
  href: string
}) {
  return (
    <Link
      href={href}
      aria-current={active ? 'page' : undefined}
      className={`block rounded-2xl border p-4 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand md:p-6 ${
        active
          ? 'border-brand bg-surface-raised ring-1 ring-brand'
          : 'surface-card hover:bg-surface-subtle'
      }`}
    >
      <div className="text-center space-y-2">
        <div className="text-xs font-medium text-muted md:text-sm">{title}</div>
        <div className={`text-2xl md:text-4xl font-bold ${
          active ? 'text-brand' : 'text-content'
        }`}>
          {value}
        </div>
      </div>
    </Link>
  )
}
