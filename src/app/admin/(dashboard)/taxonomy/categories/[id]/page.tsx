import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { TaxonomyEditor } from '@/components/admin/TaxonomyEditor'
import type { Category, Game } from '@/types/database'

interface CategoryPageProps {
  params: Promise<{ id: string }>
}

async function getCategory(id: string): Promise<(Category & { games: Game[] }) | null> {
  // Handle "new" as a special case
  if (id === 'new') {
    return null
  }

  const supabase = createAdminClient()

  const { data: category, error } = await supabase
    .from('categories')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !category) {
    return null
  }

  // Get games linked to this category via junction table
  const { data: gameLinks } = await supabase
    .from('game_categories')
    .select('game_id')
    .eq('category_id', id)

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
    ...category,
    games,
  }
}

export default async function AdminCategoryPage({ params }: CategoryPageProps) {
  const { id } = await params

  // Handle "new" category
  if (id === 'new') {
    return <TaxonomyEditor type="category" isNew />
  }

  const category = await getCategory(id)

  if (!category) {
    notFound()
  }

  return <TaxonomyEditor type="category" item={category} />
}
