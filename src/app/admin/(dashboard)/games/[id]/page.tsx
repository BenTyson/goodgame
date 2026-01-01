import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { GameEditor } from '@/components/admin/GameEditor'

// Disable caching to always fetch fresh data
export const dynamic = 'force-dynamic'

async function getGameWithImages(id: string) {
  const supabase = createAdminClient()

  const { data: game, error } = await supabase
    .from('games')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !game) {
    return null
  }

  // Fetch images
  const { data: images } = await supabase
    .from('game_images')
    .select('*')
    .eq('game_id', id)
    .order('display_order')

  // Fetch linked publishers with website
  const { data: publisherLinks } = await supabase
    .from('game_publishers')
    .select('publisher:publishers(id, name, slug, website)')
    .eq('game_id', id)

  const publishers = publisherLinks
    ?.map(p => p.publisher)
    .filter(Boolean) as { id: string; name: string; slug: string; website: string | null }[] | undefined

  return {
    ...game,
    images: images || [],
    publishers_list: publishers || []
  }
}

export default async function GameEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const game = await getGameWithImages(id)

  if (!game) {
    notFound()
  }

  return <GameEditor game={game} />
}
