import { notFound } from 'next/navigation'
import { GameEditor } from '@/components/admin/GameEditor'
import { getGameEditorData } from '@/lib/supabase/game-queries'

// Disable caching to always fetch fresh data
export const dynamic = 'force-dynamic'

export default async function GameEditorPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  // Fetch ALL editor data in a single consolidated query
  const editorData = await getGameEditorData(id)

  if (!editorData) {
    notFound()
  }

  return <GameEditor editorData={editorData} />
}
