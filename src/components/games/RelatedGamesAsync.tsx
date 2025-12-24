import { getRelatedGames } from '@/lib/supabase/queries'
import { RelatedGames } from './RelatedGames'

interface RelatedGamesAsyncProps {
  gameSlug: string
  title?: string
}

export async function RelatedGamesAsync({ gameSlug, title }: RelatedGamesAsyncProps) {
  const relatedGames = await getRelatedGames(gameSlug)

  if (relatedGames.length === 0) {
    return null
  }

  return <RelatedGames games={relatedGames} title={title} />
}
