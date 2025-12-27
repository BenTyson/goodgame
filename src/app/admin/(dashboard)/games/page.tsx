import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ExternalLink,
  Eye,
  Pencil,
  Users,
  Scale,
  CheckCircle2,
  FileEdit,
  Clock,
  Search,
  Filter,
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
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {games.map((game) => (
          <Card key={game.id} className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 group">
            {/* Image */}
            <Link href={`/admin/games/${game.id}`}>
              <div className="relative h-40 bg-muted">
                {game.thumbnail_url ? (
                  <Image
                    src={game.thumbnail_url}
                    alt={game.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Gamepad2 className="h-12 w-12 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  {getStatusBadge(game)}
                </div>
              </div>
            </Link>

            {/* Content */}
            <CardContent className="p-4">
              <Link href={`/admin/games/${game.id}`}>
                <h3 className="font-semibold text-lg group-hover:text-primary transition-colors line-clamp-1">
                  {game.name}
                </h3>
              </Link>
              {game.tagline && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {game.tagline}
                </p>
              )}

              {/* Meta */}
              <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Users className="h-3.5 w-3.5" />
                  <span>{game.player_count_min}-{game.player_count_max}</span>
                </div>
                {game.weight && (
                  <div className="flex items-center gap-1">
                    <Scale className="h-3.5 w-3.5" />
                    <span>{game.weight.toFixed(1)}</span>
                  </div>
                )}
                {game.bgg_id && (
                  <a
                    href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 hover:text-primary"
                  >
                    <span>BGG</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                {game.is_published && (
                  <a
                    href={`/games/${game.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <Eye className="h-3.5 w-3.5" />
                      View
                    </Button>
                  </a>
                )}
                <Link href={`/admin/games/${game.id}`} className="ml-auto">
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
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
