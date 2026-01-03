import Link from 'next/link'
import Image from 'next/image'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { SourcedImage } from '@/components/admin/TempImage'
import {
  CheckCircle2,
  FileEdit,
  Clock,
  Search,
  Dices,
  ChevronLeft,
  ChevronRight,
  Link2,
} from 'lucide-react'

const ITEMS_PER_PAGE = 60

async function getGames(filter?: string, search?: string, page: number = 1) {
  const supabase = createAdminClient()
  const offset = (page - 1) * ITEMS_PER_PAGE

  let query = supabase
    .from('games')
    .select('id, name, slug, content_status, is_published, bgg_id, created_at, weight, player_count_min, player_count_max, thumbnail_url, wikidata_image_url, tagline, bgg_raw_data', { count: 'exact' })
    .order('name', { ascending: true })

  if (filter === 'published') {
    query = query.eq('is_published', true)
  } else if (filter === 'draft') {
    query = query.eq('is_published', false).eq('content_status', 'draft')
  } else if (filter === 'pending') {
    query = query.eq('is_published', false).or('content_status.is.null,content_status.eq.none')
  } else if (filter === 'unpublished') {
    query = query.eq('is_published', false)
  } else if (filter === 'needs-relations') {
    query = query.eq('has_unimported_relations', true)
  }

  if (search) {
    query = query.ilike('name', `%${search}%`)
  }

  query = query.range(offset, offset + ITEMS_PER_PAGE - 1)

  const { data: games, count } = await query

  return {
    games: games || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
  }
}

async function getGameCounts() {
  const supabase = createAdminClient()

  const [
    { count: total },
    { count: published },
    { count: unpublished },
    { count: draft },
    { count: pending },
    { count: needsRelations },
  ] = await Promise.all([
    supabase.from('games').select('*', { count: 'exact', head: true }),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_published', true),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_published', false),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_published', false).eq('content_status', 'draft'),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_published', false).or('content_status.is.null,content_status.eq.none'),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('has_unimported_relations', true),
  ])

  return {
    total: total || 0,
    published: published || 0,
    unpublished: unpublished || 0,
    draft: draft || 0,
    pending: pending || 0,
    needsRelations: needsRelations || 0,
  }
}

export default async function AdminGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string; q?: string; page?: string }>
}) {
  const { filter, q, page: pageParam } = await searchParams
  const page = pageParam ? parseInt(pageParam) : 1

  const [{ games, total, totalPages }, counts] = await Promise.all([
    getGames(filter, q, page),
    getGameCounts(),
  ])

  const filters = [
    { label: 'All', value: undefined, icon: Dices, count: counts.total },
    { label: 'Published', value: 'published', icon: CheckCircle2, color: 'text-green-500', count: counts.published },
    { label: 'Unpublished', value: 'unpublished', icon: Clock, color: 'text-orange-500', count: counts.unpublished },
    { label: 'Draft', value: 'draft', icon: FileEdit, color: 'text-yellow-500', count: counts.draft },
    { label: 'Pending', value: 'pending', icon: Clock, color: 'text-gray-500', count: counts.pending },
    { label: 'Needs Relations', value: 'needs-relations', icon: Link2, color: 'text-blue-500', count: counts.needsRelations },
  ]

  // Build pagination URL helper
  const buildPageUrl = (newPage: number) => {
    const params = new URLSearchParams()
    if (filter) params.set('filter', filter)
    if (q) params.set('q', q)
    if (newPage > 1) params.set('page', newPage.toString())
    const qs = params.toString()
    return `/admin/games${qs ? `?${qs}` : ''}`
  }

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
          <div className="text-3xl font-bold">{total}</div>
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
                  {f.label} ({f.count})
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

      {/* Pagination Top */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * ITEMS_PER_PAGE + 1}-{Math.min(page * ITEMS_PER_PAGE, total)} of {total} games
          </p>
          <div className="flex items-center gap-2">
            <Link href={buildPageUrl(Math.max(1, page - 1))}>
              <Button variant="outline" size="sm" disabled={page <= 1}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
            </Link>
            <span className="text-sm text-muted-foreground">
              Page {page} of {totalPages}
            </span>
            <Link href={buildPageUrl(Math.min(totalPages, page + 1))}>
              <Button variant="outline" size="sm" disabled={page >= totalPages}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Games Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {games.map((game) => (
          <Link key={game.id} href={`/admin/games/${game.id}`}>
            <Card padding="none" className="overflow-hidden transition-all hover:shadow-lg hover:border-primary/50 group cursor-pointer h-full">
              <div className="relative aspect-[4/3] bg-muted">
                {game.wikidata_image_url ? (
                  <SourcedImage
                    src={game.wikidata_image_url}
                    alt={game.name}
                    source="wikidata"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : game.thumbnail_url ? (
                  <SourcedImage
                    src={game.thumbnail_url}
                    alt={game.name}
                    source="uploaded"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (game.bgg_raw_data as { reference_images?: { thumbnail?: string } })?.reference_images?.thumbnail ? (
                  <SourcedImage
                    src={(game.bgg_raw_data as { reference_images?: { thumbnail?: string } }).reference_images!.thumbnail!}
                    alt={game.name}
                    source="bgg"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Dices className="h-8 w-8 text-muted-foreground/30" />
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

      {/* Pagination Bottom */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4 border-t">
          <Link href={buildPageUrl(Math.max(1, page - 1))}>
            <Button variant="outline" size="sm" disabled={page <= 1}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
          </Link>
          <div className="flex items-center gap-1">
            {/* Show page numbers */}
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number
              if (totalPages <= 5) {
                pageNum = i + 1
              } else if (page <= 3) {
                pageNum = i + 1
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i
              } else {
                pageNum = page - 2 + i
              }
              return (
                <Link key={pageNum} href={buildPageUrl(pageNum)}>
                  <Button
                    variant={page === pageNum ? 'default' : 'outline'}
                    size="sm"
                    className="w-8 h-8 p-0"
                  >
                    {pageNum}
                  </Button>
                </Link>
              )
            })}
          </div>
          <Link href={buildPageUrl(Math.min(totalPages, page + 1))}>
            <Button variant="outline" size="sm" disabled={page >= totalPages}>
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </Link>
        </div>
      )}

      {/* Empty State */}
      {games.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Dices className="h-12 w-12 mx-auto text-muted-foreground/50" />
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
