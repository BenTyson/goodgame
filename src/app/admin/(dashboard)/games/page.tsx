import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  CheckCircle2,
  FileEdit,
  Clock,
  Search,
  Gamepad2
} from 'lucide-react'

async function getGames(filter?: string, search?: string) {
  const supabase = createAdminClient()

  let query = supabase
    .from('games')
    .select('id, name, slug, content_status, is_published, bgg_id, created_at, weight, player_count_min, player_count_max, thumbnail_url, tagline')
    .order('name', { ascending: true })

  if (filter === 'published') {
    query = query.eq('is_published', true)
  } else if (filter === 'draft') {
    query = query.eq('is_published', false).eq('content_status', 'draft')
  } else if (filter === 'pending') {
    query = query.eq('is_published', false).eq('content_status', 'none')
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  const { data: games } = await query.limit(100)

  return games || []
}

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string }>
}) {
  const { filter, q } = await searchParams
  const games = await getGames(filter, q)

  const filters = [
    { label: 'All', value: undefined, icon: Gamepad2, count: null },
    { label: 'Published', value: 'published', icon: CheckCircle2, color: 'text-green-500' },
    { label: 'Draft', value: 'draft', icon: FileEdit, color: 'text-yellow-500' },
    { label: 'Pending', value: 'pending', icon: Clock, color: 'text-gray-500' },
  ]

  const getStatusBadge = (game: typeof games[0]) => {
    if (game.is_published) {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-green-600 text-white">
          <CheckCircle2 className="h-3 w-3" />
          Published
        </span>
      )
    }
    if (game.content_status === 'draft') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-yellow-500 text-white">
          <FileEdit className="h-3 w-3" />
          Draft
        </span>
      )
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
        <Clock className="h-3 w-3" />
        {game.content_status || 'No content'}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Games</h1>
          <p className="text-muted-foreground mt-1">
            Manage game content, images, and publishing status
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">{games.length}</div>
          <div className="text-sm text-muted-foreground">
            {filter ? `${filter} games` : 'total games'}
          </div>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex gap-2 flex-wrap">
          {filters.map((f) => {
            const isActive = filter === f.value || (!filter && !f.value)
            return (
              <Link
                key={f.label}
                href={f.value ? `/admin/games?filter=${f.value}${q ? `&q=${q}` : ''}` : `/admin/games${q ? `?q=${q}` : ''}`}
              >
                <Button
                  variant={isActive ? 'default' : 'outline'}
                  size="sm"
                  className="gap-1.5"
                >
                  {f.icon && <f.icon className={`h-3.5 w-3.5 ${!isActive && f.color ? f.color : ''}`} />}
                  {f.label}
                </Button>
              </Link>
            )
          })}
        </div>
        <form className="flex-1 max-w-sm" action="/admin/games" method="get">
          {filter && <input type="hidden" name="filter" value={filter} />}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              name="q"
              placeholder="Search games..."
              defaultValue={q}
              className="pl-9"
            />
          </div>
        </form>
      </div>

      {/* Games Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {games.map((game) => (
          <Link key={game.id} href={`/admin/games/${game.id}`}>
            <Card className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 group cursor-pointer h-full">
              <div className="relative aspect-[4/3] bg-muted">
                {game.thumbnail_url ? (
                  <Image
                    src={game.thumbnail_url}
                    alt={game.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gamepad2 className="h-8 w-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-1.5 right-1.5">
                  {getStatusBadge(game)}
                </div>
              </div>
              <CardContent className="p-2.5">
                <h3 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-2 leading-tight">
                  {game.name}
                </h3>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Empty State */}
      {games.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Gamepad2 className="h-12 w-12 mx-auto text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">No games found</h3>
            <p className="text-muted-foreground mt-1">
              {q ? `No games matching "${q}"` : 'Try adjusting your filters'}
            </p>
            {(filter || q) && (
              <Link href="/admin/games">
                <Button variant="outline" className="mt-4">
                  Clear filters
                </Button>
              </Link>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}
