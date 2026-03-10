import BaseContentTable from './BaseContentTable'

interface Content {
  id: string
  source: string
  url: string
  title?: string | null
  summary: string
  score: number
  analyzedAt: Date
  analyzedBy?: string | null
  favorited: boolean
}

interface ContentTableProps {
  contents: Content[]
  onDelete?: (id: string) => void
}

export default function ContentTable({ contents, onDelete }: ContentTableProps) {
  return (
    <BaseContentTable
      contents={contents}
      onDelete={onDelete}
      type="content"
      detailPath={(id) => `/content/${id}`}
      showAnalyzedBy={true}
    />
  )
}
