import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { TaxonomyEditor } from '@/components/admin/TaxonomyEditor'
import type { Theme, Game } from '@/types/database'

interface ThemePageProps {
  params: Promise<{ id: string }>
}

async function getTheme(id: string): Promise<(Theme & { games: Game[] }) | null> {
  // Handle "new" as a special case
  if (id === 'new') {
    return null
  }

  const supabase = createAdminClient()

  const { data: theme, error } = await supabase
    .from('themes')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !theme) {
    return null
  }

  // Get games linked to this theme via junction table
  const { data: gameLinks } = await supabase
    .from('game_themes')
    .select('game_id')
    .eq('theme_id', id)

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
    ...theme,
    games,
  }
}

export default async function AdminThemePage({ params }: ThemePageProps) {
  const { id } = await params

  // Handle "new" theme
  if (id === 'new') {
    return <TaxonomyEditor type="theme" isNew />
  }

  const theme = await getTheme(id)

  if (!theme) {
    notFound()
  }

  return <TaxonomyEditor type="theme" item={theme} />
}
