import { getAdultContentById } from '@/lib/adult-api'
import { notFound } from 'next/navigation'
import ContentDetailPageView from '@/components/ContentDetailPageView'
import FavoriteButton from '@/components/FavoriteButton'

export default async function AdultContentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const content = await getAdultContentById(id)

  if (!content) notFound()

  return (
    <ContentDetailPageView
      content={{ ...content, mediaUrls: content.mediaUrls || [] }}
      kind="adultContent"
      fallbackHref="/?tab=adult"
      favoriteSlot={<FavoriteButton id={content.id} initialFavorited={content.favorited} type="adult-content" />}
    />
  )
}
