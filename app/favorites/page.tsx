import { getAllContents } from '@/lib/api'
import { getAllAdultContents } from '@/lib/adult-api'
import Link from 'next/link'
import { ArrowLeft, Heart, TrendingUp } from '@/components/Icon'
import FavoritesContent from '@/components/FavoritesContent'

export const revalidate = 0

export default async function FavoritesPage({
  searchParams
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const params = await searchParams
  const tab = params.tab || 'all'
  
  // 获取所有收藏的内容
  const [techContents, adultContents] = await Promise.all([
    getAllContents('createdAt'),
    getAllAdultContents('createdAt')
  ])
  
  const favoritedTech = techContents.filter((c: { favorited: boolean }) => c.favorited)
  const favoritedAdult = adultContents.filter((c: { favorited: boolean }) => c.favorited)
  
  const stats = {
    total: favoritedTech.length + favoritedAdult.length,
    tech: favoritedTech.length,
    adult: favoritedAdult.length
  }

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 返回按钮 */}
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回首页
      </Link>

      {/* 页面标题 */}
      <div className="text-center space-y-3 md:space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Heart className="w-8 h-8 md:w-10 md:h-10 text-red-500 fill-current" />
          <h1 className="text-3xl md:text-4xl font-bold text-black">
            我的收藏
          </h1>
        </div>
        <p className="text-base md:text-lg text-gray-600">
          共收藏 {stats.total} 条内容
        </p>
        {stats.total > 0 && (
          <Link
            href="/preferences"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 transition-colors"
          >
            <TrendingUp className="w-4 h-4" />
            查看偏好分析
          </Link>
        )}
      </div>

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
      className={`block bg-white border rounded-lg p-4 md:p-6 transition-all ${
        active
          ? 'border-red-500 ring-2 ring-red-100'
          : 'border-gray-200 hover:border-gray-300'
      }`}
    >
      <div className="text-center space-y-2">
        <div className="text-xs md:text-sm font-medium text-gray-600">{title}</div>
        <div className={`text-2xl md:text-4xl font-bold ${
          active ? 'text-red-500' : 'text-black'
        }`}>
          {value}
        </div>
      </div>
    </Link>
  )
}
