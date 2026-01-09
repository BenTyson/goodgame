import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/server'
import { GameEditor } from '@/components/admin/GameEditor'
import type { GameVideo } from '@/components/admin/VideoManager'

// Disable caching to always fetch fresh data
export const dynamic = 'force-dynamic'

async function getGameWithMedia(id: string) {
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

  // Fetch videos
  const { data: videos } = await supabase
    .from('game_videos')
    .select('*')
    .eq('game_id', id)
    .order('display_order')

  // Fetch linked publishers with website, ordered by is_primary desc
  const { data: publisherLinks } = await supabase
    .from('game_publishers')
    .select('is_primary, publisher:publishers(id, name, slug, website)')
    .eq('game_id', id)
    .order('is_primary', { ascending: false })
    .order('display_order', { ascending: true })

  const publishers = publisherLinks
    ?.map(p => ({ ...p.publisher, is_primary: p.is_primary }))
    .filter(p => p.id) as { id: string; name: string; slug: string; website: string | null; is_primary: boolean }[] | undefined

  // Cast videos to expected type (database has defaults for non-null fields)
  const typedVideos: GameVideo[] = (videos || []).map(v => ({
    ...v,
    display_order: v.display_order ?? 0,
    is_featured: v.is_featured ?? false,
    created_at: v.created_at ?? new Date().toISOString(),
    updated_at: v.updated_at ?? new Date().toISOString(),
  })) as GameVideo[]

  return {
    ...game,
    images: images || [],
    videos: typedVideos,
    publishers_list: publishers || []
  }
}

export default async function GameEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const game = await getGameWithMedia(id)

  if (!game) {
    notFound()
  }

  return <GameEditor game={game} />
}
