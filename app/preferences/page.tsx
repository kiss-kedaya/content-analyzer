import Link from 'next/link'
import { ArrowLeft, TrendingUp, Hash, BarChart3 } from '@/components/Icon'

export const revalidate = 0

interface Preferences {
  keywords: string[]
  avgScore: number
  preferredSources: string[]
  contentTypes: { tech: number; adult: number }
  totalFavorites: number
  analyzedAt: string
}

async function getPreferences(): Promise<Preferences | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/preferences/analyze`, {
      cache: 'no-store'
    })
    
    if (!response.ok) return null
    
    const data = await response.json()
    return data.preferences
  } catch (error) {
    console.error('Failed to fetch preferences:', error)
    return null
  }
}

export default async function PreferencesPage() {
  const preferences = await getPreferences()

  return (
    <div className="space-y-6 md:space-y-8">
      {/* 返回按钮 */}
      <Link
        href="/favorites"
        className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-black transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        返回收藏夹
      </Link>

      {/* 页面标题 */}
      <div className="text-center space-y-3 md:space-y-4">
        <div className="flex items-center justify-center gap-3">
          <TrendingUp className="w-8 h-8 md:w-10 md:h-10 text-blue-500" />
          <h1 className="text-3xl md:text-4xl font-bold text-black">
            用户偏好分析
          </h1>
        </div>
        <p className="text-base md:text-lg text-gray-600">
          基于收藏内容的智能分析
        </p>
      </div>

      {!preferences ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <BarChart3 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <p className="text-lg font-medium text-gray-500">暂无数据</p>
          <p className="text-sm text-gray-400 mt-2">收藏一些内容后即可查看偏好分析</p>
          <Link
            href="/"
            className="inline-block mt-6 px-6 py-3 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 transition-colors"
          >
            浏览内容
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* 概览卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <StatCard
              title="总收藏数"
              value={preferences.totalFavorites}
              icon={<BarChart3 className="w-5 h-5 text-blue-500" />}
            />
            <StatCard
              title="平均评分"
              value={preferences.avgScore.toFixed(1)}
              icon={<TrendingUp className="w-5 h-5 text-green-500" />}
            />
            <StatCard
              title="偏好来源"
              value={preferences.preferredSources.length}
              icon={<Hash className="w-5 h-5 text-purple-500" />}
            />
          </div>

          {/* 内容类型分布 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-black mb-4 md:mb-6">
              内容类型分布
            </h2>
            <div className="space-y-4">
              <TypeBar
                label="技术内容"
                value={preferences.contentTypes.tech}
                total={preferences.totalFavorites}
                color="bg-blue-500"
              />
              <TypeBar
                label="成人内容"
                value={preferences.contentTypes.adult}
                total={preferences.totalFavorites}
                color="bg-pink-500"
              />
            </div>
          </div>

          {/* 偏好来源 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-black mb-4 md:mb-6">
              偏好来源
            </h2>
            <div className="flex flex-wrap gap-2">
              {preferences.preferredSources.map(source => (
                <span
                  key={source}
                  className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm font-medium"
                >
                  {source}
                </span>
              ))}
            </div>
          </div>

          {/* 关键词云 */}
          <div className="bg-white border border-gray-200 rounded-lg p-6 md:p-8">
            <h2 className="text-xl md:text-2xl font-semibold text-black mb-4 md:mb-6">
              关键词分析
            </h2>
            <div className="flex flex-wrap gap-2">
              {preferences.keywords.map((keyword, index) => (
                <span
                  key={keyword}
                  className="inline-flex items-center px-3 py-1.5 bg-blue-50 text-blue-700 rounded-md text-sm font-medium border border-blue-200"
                  style={{
                    fontSize: `${Math.max(0.75, 1 - index * 0.05)}rem`
                  }}
                >
                  {keyword}
                </span>
              ))}
            </div>
          </div>

          {/* 分析时间 */}
          <div className="text-center text-sm text-gray-500">
            分析时间: {new Date(preferences.analyzedAt).toLocaleString('zh-CN')}
          </div>
        </div>
      )}
    </div>
  )
}

function StatCard({
  title,
  value,
  icon
}: {
  title: string
  value: number | string
  icon: React.ReactNode
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-medium text-gray-600">{title}</span>
        {icon}
      </div>
      <div className="text-3xl md:text-4xl font-bold text-black">
        {value}
      </div>
    </div>
  )
}

function TypeBar({
  label,
  value,
  total,
  color
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <span className="text-sm text-gray-500">
          {value} ({percentage.toFixed(1)}%)
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-3">
        <div
          className={`${color} h-3 rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  )
}
