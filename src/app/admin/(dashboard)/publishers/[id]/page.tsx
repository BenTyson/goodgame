import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { PublisherEditor } from '@/components/admin/PublisherEditor'
import type { Publisher, Game } from '@/types/database'

interface PublisherPageProps {
  params: Promise<{ id: string }>
}

async function getPublisher(id: string): Promise<(Publisher & { games: Game[] }) | null> {
  // Handle "new" as a special case
  if (id === 'new') {
    return null
  }

  const supabase = createAdminClient()

  const { data: publisher, error } = await supabase
    .from('publishers')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !publisher) {
    return null
  }

  // Get games linked to this publisher via junction table
  const { data: gameLinks } = await supabase
    .from('game_publishers')
    .select('game_id')
    .eq('publisher_id', id)

  const gameIds = gameLinks?.map(link => link.game_id) || []

  let games: Game[] = []
  if (gameIds.length > 0) {
    const { data: gamesData } = await supabase
      .from('games')
      .select('*')
      .in('id', gameIds)
      .order('name')

    games = gamesData || []
  }

  return {
    ...publisher,
    games,
  }
}

export default async function AdminPublisherPage({ params }: PublisherPageProps) {
  const { id } = await params

  // Handle "new" publisher
  if (id === 'new') {
    return <PublisherEditor isNew />
  }

  const publisher = await getPublisher(id)

  if (!publisher) {
    notFound()
  }

  return <PublisherEditor publisher={publisher} />
}
