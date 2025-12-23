import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, Eye, Pencil } from 'lucide-react'

async function getGames(filter?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('games')
    .select('id, name, slug, content_status, is_published, bgg_id, created_at, weight, player_count_min, player_count_max')
    .order('created_at', { ascending: false })

  if (filter === 'published') {
    query = query.eq('is_published', true)
  } else if (filter === 'draft') {
    query = query.eq('is_published', false).eq('content_status', 'draft')
  } else if (filter === 'pending') {
    query = query.eq('is_published', false).eq('content_status', 'none')
  }

  const { data: games } = await query.limit(100)

  return games || []
}

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const games = await getGames(filter)

  const filters = [
    { label: 'All', value: undefined },
    { label: 'Published', value: 'published' },
    { label: 'Draft', value: 'draft' },
    { label: 'Pending', value: 'pending' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Games</h1>
          <p className="text-muted-foreground">Manage game content and publishing</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.label}
            href={f.value ? `/admin/games?filter=${f.value}` : '/admin/games'}
          >
            <Button
              variant={filter === f.value || (!filter && !f.value) ? 'default' : 'outline'}
              size="sm"
            >
              {f.label}
            </Button>
          </Link>
        ))}
      </div>

      {/* Games Table */}
      <Card>
        <CardHeader>
          <CardTitle>Games ({games.length})</CardTitle>
          <CardDescription>
            {filter === 'published' && 'Games live on the site'}
            {filter === 'draft' && 'Games with AI content ready for review'}
            {filter === 'pending' && 'Games waiting for content generation'}
            {!filter && 'All games in the database'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Game</th>
                  <th className="px-4 py-3 text-left">Players</th>
                  <th className="px-4 py-3 text-left">Weight</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">BGG</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {games.map((game) => (
                  <tr key={game.id} className="border-b">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium">{game.name}</p>
                        <p className="text-xs text-muted-foreground">{game.slug}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      {game.player_count_min}-{game.player_count_max}
                    </td>
                    <td className="px-4 py-3">
                      {game.weight?.toFixed(1) || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          game.is_published
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : game.content_status === 'draft'
                            ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {game.is_published ? 'Published' : game.content_status || 'none'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {game.bgg_id ? (
                        <a
                          href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          {game.bgg_id}
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        {game.is_published && (
                          <Link href={`/games/${game.slug}`}>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        )}
                        <Link href={`/admin/games/${game.id}`}>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {games.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              No games found
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
