import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { TaxonomyEditor } from '@/components/admin/TaxonomyEditor'
import type { PlayerExperience, Game } from '@/types/database'

interface PlayerExperiencePageProps {
  params: Promise<{ id: string }>
}

async function getPlayerExperience(id: string): Promise<(PlayerExperience & { games: Game[] }) | null> {
  // Handle "new" as a special case
  if (id === 'new') {
    return null
  }

  const supabase = createAdminClient()

  const { data: experience, error } = await supabase
    .from('player_experiences')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !experience) {
    return null
  }

  // Get games linked to this experience via junction table
  const { data: gameLinks } = await supabase
    .from('game_player_experiences')
    .select('game_id')
    .eq('player_experience_id', id)

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
    ...experience,
    games,
  }
}

export default async function AdminPlayerExperiencePage({ params }: PlayerExperiencePageProps) {
  const { id } = await params

  // Handle "new" experience
  if (id === 'new') {
    return <TaxonomyEditor type="player-experience" isNew />
  }

  const experience = await getPlayerExperience(id)

  if (!experience) {
    notFound()
  }

  return <TaxonomyEditor type="player-experience" item={experience} />
}
