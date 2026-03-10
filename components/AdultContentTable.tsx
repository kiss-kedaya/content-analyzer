import BaseContentTable from './BaseContentTable'

interface AdultContent {
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

interface AdultContentTableProps {
  contents: AdultContent[]
  onDelete?: (id: string) => void
}

export default function AdultContentTable({ contents, onDelete }: AdultContentTableProps) {
  return (
    <BaseContentTable
      contents={contents}
      onDelete={onDelete}
      type="adult-content"
      detailPath={(id) => `/adult-content/${id}`}
      showAnalyzedBy={false}
    />
  )
}
