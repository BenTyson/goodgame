import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { TaxonomyEditor } from '@/components/admin/TaxonomyEditor'
import type { Mechanic, Game } from '@/types/database'

interface MechanicPageProps {
  params: Promise<{ id: string }>
}

async function getMechanic(id: string): Promise<(Mechanic & { games: Game[] }) | null> {
  // Handle "new" as a special case
  if (id === 'new') {
    return null
  }

  const supabase = createAdminClient()

  const { data: mechanic, error } = await supabase
    .from('mechanics')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !mechanic) {
    return null
  }

  // Get games linked to this mechanic via junction table
  const { data: gameLinks } = await supabase
    .from('game_mechanics')
    .select('game_id')
    .eq('mechanic_id', id)

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
    ...mechanic,
    games,
  }
}

export default async function AdminMechanicPage({ params }: MechanicPageProps) {
  const { id } = await params

  // Handle "new" mechanic
  if (id === 'new') {
    return <TaxonomyEditor type="mechanic" isNew />
  }

  const mechanic = await getMechanic(id)

  if (!mechanic) {
    notFound()
  }

  return <TaxonomyEditor type="mechanic" item={mechanic} />
}
