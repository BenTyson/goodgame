import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { FamilyEditor } from '@/components/admin/FamilyEditor'
import type { GameFamily, Game, GameRelation } from '@/types/database'

interface FamilyPageProps {
  params: Promise<{ id: string }>
}

interface FamilyWithRelations extends GameFamily {
  games: Game[]
  relations: GameRelation[]
}

async function getFamily(id: string): Promise<FamilyWithRelations | null> {
  // Handle "new" as a special case
  if (id === 'new') {
    return null
  }

  const supabase = createAdminClient()

  const { data: family, error } = await supabase
    .from('game_families')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !family) {
    return null
  }

  // Get games in this family
  const { data: games } = await supabase
    .from('games')
    .select('*')
    .eq('family_id', id)
    .order('year_published', { ascending: true, nullsFirst: false })

  const gameIds = games?.map(g => g.id) || []

  // Get all relations where BOTH source and target are in this family
  // (We only want to show relations within the family tree)
  let relations: GameRelation[] = []
  if (gameIds.length > 0) {
    // First get all relations where source is in family
    const { data: sourceRelations } = await supabase
      .from('game_relations')
      .select('*')
      .in('source_game_id', gameIds)

    // Filter to only include relations where target is also in family
    relations = (sourceRelations || []).filter(r => gameIds.includes(r.target_game_id))
  }

  return {
    ...family,
    games: games || [],
    relations,
  }
}

export default async function AdminFamilyPage({ params }: FamilyPageProps) {
  const { id } = await params

  // Handle "new" family
  if (id === 'new') {
    return <FamilyEditor isNew />
  }

  const family = await getFamily(id)

  if (!family) {
    notFound()
  }

  return <FamilyEditor family={family} />
}
