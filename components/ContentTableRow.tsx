import { Trash2, ExternalLink } from './Icon'
import FavoriteButton from './FavoriteButton'

interface Content {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  score: number
  analyzedAt: Date
  favorited: boolean
}

interface ContentTableRowProps {
  content: Content
  onDelete: (id: string) => void
}

/**
 * 内容表格行组件
 * 
 * 从 ContentTable 中拆分出来，提高可维护性
 */
export default function ContentTableRow({ content, onDelete }: ContentTableRowProps) {
  const handleDelete = async () => {
    if (!confirm('确定要删除这条内容吗？')) return
    
    try {
      const response = await fetch(`/api/content/${content.id}`, {
        method: 'DELETE',
      })
      
      if (response.ok) {
        onDelete(content.id)
      } else {
        alert('删除失败')
      }
    } catch (error) {
      console.error('Delete error:', error)
      alert('删除失败')
    }
  }

  return (
    <tr className="border-b border-gray-200 hover:bg-gray-50 transition-colors">
      <td className="px-4 py-3 text-sm">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            content.source === 'twitter' ? 'bg-blue-100 text-blue-700' :
            content.source === 'xiaohongshu' ? 'bg-red-100 text-red-700' :
            'bg-gray-100 text-gray-700'
          }`}>
            {content.source}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="space-y-1">
          {content.title && (
            <div className="font-medium text-gray-900 line-clamp-1">
              {content.title}
            </div>
          )}
          <div className="text-sm text-gray-600 line-clamp-2">
            {content.summary}
          </div>
        </div>
      </td>
      <td className="px-4 py-3 text-center">
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
          content.score >= 8 ? 'bg-green-100 text-green-700' :
          content.score >= 6 ? 'bg-yellow-100 text-yellow-700' :
          'bg-red-100 text-red-700'
        }`}>
          {content.score.toFixed(1)}
        </span>
      </td>
      <td className="px-4 py-3 text-sm text-gray-500 text-center">
        {new Date(content.analyzedAt).toLocaleDateString('zh-CN')}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-2">
          <FavoriteButton
            id={content.id}
            initialFavorited={content.favorited}
            type="content"
          />
          <a
            href={content.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors"
            title="查看原文"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
          <button
            onClick={handleDelete}
            className="p-1.5 text-gray-400 hover:text-red-600 transition-colors"
            title="删除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  )
}
