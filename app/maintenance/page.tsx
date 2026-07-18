import PageHeader from '@/components/PageHeader'
import XMediaCleanupPanel from '@/components/XMediaCleanupPanel'

export const dynamic = 'force-dynamic'

export default function MaintenancePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="数据清理"
        description="检查并清理原视频已经无法访问的 X 内容。"
        backHref="/"
        backLabel="返回首页"
      />
      <XMediaCleanupPanel />
    </div>
  )
}
