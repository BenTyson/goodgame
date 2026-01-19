import { Metadata } from 'next'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { Button } from '@/components/ui/button'
import { CreateTableForm } from '@/components/tables'
import type { Game } from '@/types/database'

export const metadata: Metadata = {
  title: 'Create Table | Boardmello',
  description: 'Host a new game table and invite friends.',
}

interface PageProps {
  searchParams: Promise<{ gameId?: string }>
}

export default async function CreateTablePage({ searchParams }: PageProps) {
  const { gameId } = await searchParams
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/tables/new')
  }

  // Get user's shelf games for selection
  const { data: shelfGames } = await supabase
    .from('user_games')
    .select(`
      game:games (
        id,
        name,
        slug,
        thumbnail_url,
        box_image_url,
        player_count_min,
        player_count_max
      )
    `)
    .eq('user_id', user.id)
    .in('status', ['owned', 'want_to_play', 'played'])

  const games = (shelfGames || [])
    .map((sg) => sg.game)
    .filter((g): g is Game => g !== null)
    .sort((a, b) => a.name.localeCompare(b.name))

  // Check for preselected game
  let preselectedGame: Game | undefined
  if (gameId) {
    const { data: game } = await supabase
      .from('games')
      .select('id, name, slug, thumbnail_url, box_image_url, player_count_min, player_count_max')
      .eq('id', gameId)
      .single()

    if (game) {
      preselectedGame = game as Game
    }
  }

  return (
    <div className="container max-w-xl py-8">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" size="sm" asChild className="mb-4 -ml-2">
          <Link href="/tables">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Tables
          </Link>
        </Button>
        <h1 className="text-2xl font-bold">Host a Table</h1>
        <p className="text-muted-foreground">
          Plan a game night and invite your friends
        </p>
      </div>

      {/* Form */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6">
        <CreateTableForm
          games={games}
          preselectedGame={preselectedGame}
        />
      </div>
    </div>
  )
}
