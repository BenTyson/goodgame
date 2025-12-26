import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { FamilyEditor } from '@/components/admin/FamilyEditor'
import type { GameFamily, Game } from '@/types/database'

interface FamilyPageProps {
  params: Promise<{ id: string }>
}

async function getFamily(id: string): Promise<(GameFamily & { games: Game[] }) | null> {
  // Handle "new" as a special case
  if (id === 'new') {
    return null
  }

  const supabase = await createClient()

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
    .order('name')

  return {
    ...family,
    games: games || [],
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
