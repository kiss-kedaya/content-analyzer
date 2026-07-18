import { getContentById } from '@/lib/api'
import { notFound } from 'next/navigation'
import ContentDetailPageView from '@/components/ContentDetailPageView'
import FavoriteButton from '@/components/FavoriteButton'

export default async function ContentDetailPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const content = await getContentById(id)

  if (!content) {
    notFound()
  }

  return (
    <ContentDetailPageView
      content={{
        ...content,
        mediaUrls: content.mediaUrls || [],
      }}
      kind="content"
      fallbackHref="/"
      favoriteSlot={<FavoriteButton id={content.id} initialFavorited={content.favorited} type="content" />}
    />
  )
}
