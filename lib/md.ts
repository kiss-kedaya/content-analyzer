import { SourceCache } from '@prisma/client'

type AnyContent = {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  content: string
  score: number
  analyzedBy?: string | null
  analyzedAt: Date
  createdAt: Date
  updatedAt: Date
  favorited?: boolean
}

function mdEscape(text: string): string {
  return String(text ?? '').replace(/\r\n/g, '\n')
}

export function renderContentMarkdown(item: AnyContent, raw?: SourceCache | null): string {
  const title = item.title?.trim() ? item.title.trim() : '(无标题)'

  const lines: string[] = []
  lines.push(`# ${mdEscape(title)}`)
  lines.push('')
  lines.push('## 元信息')
  lines.push('')
  lines.push(`- ID: ${item.id}`)
  lines.push(`- 来源: ${item.source}`)
  lines.push(`- 评分: ${Number(item.score).toFixed(1)} / 10`)
  lines.push(`- 分析时间: ${new Date(item.analyzedAt).toLocaleString('zh-CN')}`)
  if (item.analyzedBy) lines.push(`- 用户名: ${mdEscape(item.analyzedBy)}`)
  lines.push(`- 原文链接: ${item.url}`)
  if (typeof item.favorited === 'boolean') lines.push(`- 收藏: ${item.favorited ? '是' : '否'}`)

  lines.push('')
  lines.push('## 摘要')
  lines.push('')
  lines.push(mdEscape(item.summary || ''))

  lines.push('')
  lines.push('## 分析正文')
  lines.push('')
  lines.push(mdEscape(item.content || ''))

  if (raw && raw.status === 'ok' && raw.text?.trim()) {
    lines.push('')
    lines.push('## 原文')
    lines.push('')
    lines.push(`- 抓取源: ${raw.provider}`)
    if (raw.title) lines.push(`- 标题: ${mdEscape(raw.title)}`)
    if (raw.lastFetchedAt) lines.push(`- 抓取时间: ${new Date(raw.lastFetchedAt).toLocaleString('zh-CN')}`)
    lines.push('')
    // Keep as a fenced block to avoid markdown injection and preserve structure
    lines.push('```text')
    lines.push(mdEscape(raw.text))
    lines.push('```')
  } else {
    lines.push('')
    lines.push('## 原文')
    lines.push('')
    lines.push('原文尚未缓存，可调用：')
    lines.push('')
    lines.push(`- GET /api/source?url=${encodeURIComponent(item.url)}`)
  }

  lines.push('')
  return lines.join('\n')
}

export function renderListMarkdown(
  opts: {
    title: string
    date: string
    page: number
    pageSize: number
    tabLabel: string
  },
  items: AnyContent[],
  rawsByUrl?: Map<string, SourceCache>
): string {
  const lines: string[] = []
  lines.push(`# ${opts.title}`)
  lines.push('')
  lines.push(`- 日期: ${opts.date}`)
  lines.push(`- 分类: ${opts.tabLabel}`)
  lines.push(`- 分页: ${opts.page} / 每页 ${opts.pageSize}`)
  lines.push('')

  items.forEach((item, idx) => {
    const raw = rawsByUrl?.get(item.url)
    const header = item.title?.trim() ? item.title.trim() : '(无标题)'
    lines.push(`## ${idx + 1}. ${mdEscape(header)}`)
    lines.push('')
    lines.push(`- ID: ${item.id}`)
    lines.push(`- 来源: ${item.source}`)
    lines.push(`- 评分: ${Number(item.score).toFixed(1)} / 10`)
    lines.push(`- 分析时间: ${new Date(item.analyzedAt).toLocaleString('zh-CN')}`)
    if (item.analyzedBy) lines.push(`- 用户名: ${mdEscape(item.analyzedBy)}`)
    lines.push(`- 原文链接: ${item.url}`)
    if (raw && raw.status === 'ok') {
      lines.push(`- 原文缓存: 是 (${raw.provider})`)
    } else {
      lines.push(`- 原文缓存: 否`)
    }
    lines.push('')
    lines.push('### 摘要')
    lines.push('')
    lines.push(mdEscape(item.summary || ''))
    lines.push('')
    lines.push('---')
    lines.push('')
  })

  return lines.join('\n')
}
