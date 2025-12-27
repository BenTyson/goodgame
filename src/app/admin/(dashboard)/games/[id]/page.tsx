import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { GameEditor } from './GameEditor'

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

  const { data: images } = await supabase
    .from('game_images')
    .select('*')
    .eq('game_id', id)
    .order('display_order')

  return {
    ...game,
    images: images || []
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
