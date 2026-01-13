import { redirect } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

/**
 * Legacy preview page - redirects to the real game page
 * Admins can now see unpublished games on /games/[slug] with preview banner
 */
export default async function GamePreviewPage({ params }: PreviewPageProps) {
  const { id } = await params

  // Get game slug
  const supabase = createAdminClient()
  const { data: game } = await supabase
    .from('games')
    .select('slug')
    .eq('id', id)
    .single()

  if (game?.slug) {
    redirect(`/games/${game.slug}`)
  }

  // No slug - redirect to editor so they can add one
  redirect(`/admin/games/${id}`)
}
