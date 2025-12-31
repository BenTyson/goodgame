import Link from 'next/link'
import { createAdminClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Image as ImageIcon,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
} from 'lucide-react'
import type { Database } from '@/types/supabase'

const ITEMS_PER_PAGE = 50

type DataSourceEnum = Database['public']['Enums']['data_source']

interface QueueSummary {
  total: number
  byContentStatus: Record<string, number>
  byDataSource: Record<string, number>
  withImages: number
  withoutImages: number
  byPriority: Record<number, number>
}

async function getQueueSummary(): Promise<QueueSummary> {
  const supabase = createAdminClient()

  // Use count queries for accurate totals (no row limit issues)
  const [
    { count: total },
    { count: withImages },
    { count: statusNone },
    { count: statusImporting },
    { count: statusDraft },
    { count: statusReview },
  ] = await Promise.all([
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_published', false),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_published', false).not('box_image_url', 'is', null),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_published', false).or('content_status.is.null,content_status.eq.none'),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_published', false).eq('content_status', 'importing'),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_published', false).eq('content_status', 'draft'),
    supabase.from('games').select('*', { count: 'exact', head: true }).eq('is_published', false).eq('content_status', 'review'),
  ])

  // Get data source breakdown (fetch all sources, no limit with head: true won't work here)
  // Use a different approach: fetch just source column with high limit
  const { data: sourceData } = await supabase
    .from('games')
    .select('data_source')
    .eq('is_published', false)
    .limit(10000)

  const byDataSource: Record<string, number> = {}
  sourceData?.forEach((game) => {
    const source = game.data_source || 'unknown'
    byDataSource[source] = (byDataSource[source] || 0) + 1
  })

  return {
    total: total || 0,
    byContentStatus: {
      none: statusNone || 0,
      importing: statusImporting || 0,
      draft: statusDraft || 0,
      review: statusReview || 0,
    },
    byDataSource,
    withImages: withImages || 0,
    withoutImages: (total || 0) - (withImages || 0),
    byPriority: {}, // Not needed for display currently
  }
}

interface QueueFilters {
  status?: string
  source?: string
  images?: string
  priority?: string
  page?: number
}

async function getQueueItems(filters: QueueFilters) {
  const supabase = createAdminClient()
  const page = filters.page || 1
  const offset = (page - 1) * ITEMS_PER_PAGE

  let query = supabase
    .from('games')
    .select('id, slug, name, year_published, content_status, data_source, box_image_url, priority, created_at, bgg_id', { count: 'exact' })
    .eq('is_published', false)
    .order('priority', { ascending: true })
    .order('created_at', { ascending: false })

  // Apply filters
  if (filters.status && filters.status !== 'all') {
    if (filters.status === 'none') {
      query = query.or('content_status.is.null,content_status.eq.none')
    } else {
      query = query.eq('content_status', filters.status)
    }
  }

  if (filters.source && filters.source !== 'all') {
    query = query.eq('data_source', filters.source as DataSourceEnum)
  }

  if (filters.images === 'with') {
    query = query.not('box_image_url', 'is', null)
  } else if (filters.images === 'without') {
    query = query.is('box_image_url', null)
  }

  if (filters.priority && filters.priority !== 'all') {
    query = query.eq('priority', parseInt(filters.priority))
  }

  // Pagination
  query = query.range(offset, offset + ITEMS_PER_PAGE - 1)

  const { data, count } = await query

  return {
    items: data || [],
    total: count || 0,
    page,
    totalPages: Math.ceil((count || 0) / ITEMS_PER_PAGE),
  }
}

function getStatusColor(status: string | null): string {
  switch (status) {
    case 'published':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'review':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'draft':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
    case 'importing':
      return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getSourceColor(source: string | null): string {
  switch (source) {
    case 'seed':
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    case 'wikidata':
      return 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-400'
    case 'legacy_bgg':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
    case 'publisher':
      return 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
    case 'manual':
      return 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400'
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }
}

function getPriorityLabel(priority: number | null): string {
  switch (priority) {
    case 1:
      return 'Critical'
    case 2:
      return 'High'
    case 3:
      return 'Normal'
    case 4:
      return 'Low'
    case 5:
      return 'Backlog'
    default:
      return 'Normal'
  }
}

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; source?: string; images?: string; priority?: string; page?: string }>
}) {
  const params = await searchParams
  const filters: QueueFilters = {
    status: params.status,
    source: params.source,
    images: params.images,
    priority: params.priority,
    page: params.page ? parseInt(params.page) : 1,
  }

  const [summary, queueData] = await Promise.all([
    getQueueSummary(),
    getQueueItems(filters),
  ])

  const { items, total, page, totalPages } = queueData

  // Build filter URL helper
  const buildFilterUrl = (newFilters: Partial<QueueFilters>) => {
    const merged = { ...filters, ...newFilters, page: newFilters.page || 1 }
    const searchParams = new URLSearchParams()
    if (merged.status && merged.status !== 'all') searchParams.set('status', merged.status)
    if (merged.source && merged.source !== 'all') searchParams.set('source', merged.source)
    if (merged.images && merged.images !== 'all') searchParams.set('images', merged.images)
    if (merged.priority && merged.priority !== 'all') searchParams.set('priority', merged.priority)
    if (merged.page && merged.page > 1) searchParams.set('page', merged.page.toString())
    const qs = searchParams.toString()
    return `/admin/queue${qs ? `?${qs}` : ''}`
  }

  const statusFilters = [
    { label: 'All', value: 'all', count: summary.total },
    { label: 'None', value: 'none', count: summary.byContentStatus['none'] || 0, icon: Clock },
    { label: 'Importing', value: 'importing', count: summary.byContentStatus['importing'] || 0, icon: AlertCircle },
    { label: 'Draft', value: 'draft', count: summary.byContentStatus['draft'] || 0, icon: FileText },
    { label: 'Review', value: 'review', count: summary.byContentStatus['review'] || 0, icon: CheckCircle },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Content Pipeline</h1>
          <p className="text-muted-foreground">
            {summary.total} games awaiting enrichment and publication
          </p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        {/* Content Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>By Content Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Needs Content</span>
                <span className="font-medium">{summary.byContentStatus['none'] || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">In Progress</span>
                <span className="font-medium text-purple-600">{summary.byContentStatus['importing'] || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Draft</span>
                <span className="font-medium text-yellow-600">{summary.byContentStatus['draft'] || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Ready for Review</span>
                <span className="font-medium text-blue-600">{summary.byContentStatus['review'] || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Data Source */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>By Data Source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              {Object.entries(summary.byDataSource)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 5)
                .map(([source, count]) => (
                  <div key={source} className="flex justify-between">
                    <span className="text-muted-foreground capitalize">{source.replace('_', ' ')}</span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Image Status */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Image Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-green-500" />
                  Has Images
                </span>
                <span className="font-medium text-green-600">{summary.withImages}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="h-4 w-4 text-red-500" />
                  Needs Images
                </span>
                <span className="font-medium text-red-600">{summary.withoutImages}</span>
              </div>
              <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${summary.total > 0 ? (summary.withImages / summary.total) * 100 : 0}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total */}
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total in Queue</CardDescription>
            <CardTitle className="text-4xl">{summary.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Unpublished games awaiting content
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground py-1">Status:</span>
          {statusFilters.map((f) => (
            <Link key={f.value} href={buildFilterUrl({ status: f.value })}>
              <Button
                variant={filters.status === f.value || (!filters.status && f.value === 'all') ? 'default' : 'outline'}
                size="sm"
              >
                {f.icon && <f.icon className="h-3 w-3 mr-1" />}
                {f.label} ({f.count})
              </Button>
            </Link>
          ))}
        </div>

        {/* Source & Image Filters */}
        <div className="flex flex-wrap gap-2">
          <span className="text-sm text-muted-foreground py-1">Source:</span>
          {['all', 'seed', 'legacy_bgg', 'wikidata', 'manual'].map((source) => (
            <Link key={source} href={buildFilterUrl({ source })}>
              <Button
                variant={filters.source === source || (!filters.source && source === 'all') ? 'secondary' : 'ghost'}
                size="sm"
              >
                {source === 'all' ? 'All Sources' : source.replace('_', ' ')}
              </Button>
            </Link>
          ))}
          <span className="text-sm text-muted-foreground py-1 ml-4">Images:</span>
          {[
            { value: 'all', label: 'All' },
            { value: 'with', label: 'Has Images' },
            { value: 'without', label: 'Needs Images' },
          ].map((opt) => (
            <Link key={opt.value} href={buildFilterUrl({ images: opt.value })}>
              <Button
                variant={filters.images === opt.value || (!filters.images && opt.value === 'all') ? 'secondary' : 'ghost'}
                size="sm"
              >
                {opt.label}
              </Button>
            </Link>
          ))}
        </div>
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Queue Items</CardTitle>
              <CardDescription>
                Showing {items.length} of {total} games
              </CardDescription>
            </div>
            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <Link href={buildFilterUrl({ page: Math.max(1, page - 1) })}>
                  <Button variant="outline" size="sm" disabled={page <= 1}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                </Link>
                <span className="text-sm text-muted-foreground">
                  Page {page} of {totalPages}
                </span>
                <Link href={buildFilterUrl({ page: Math.min(totalPages, page + 1) })}>
                  <Button variant="outline" size="sm" disabled={page >= totalPages}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">Game</th>
                  <th className="px-4 py-3 text-left">Year</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Images</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {items.map((game) => (
                  <tr key={game.id} className="border-b hover:bg-muted/50">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <Link
                          href={`/admin/games/${game.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {game.name}
                        </Link>
                        <span className="text-xs text-muted-foreground">/{game.slug}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {game.year_published || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getSourceColor(game.data_source)}`}>
                        {game.data_source?.replace('_', ' ') || 'unknown'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(game.content_status)}`}>
                        {game.content_status || 'none'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {game.box_image_url ? (
                        <Badge variant="outline" className="text-green-600 border-green-300">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          Yes
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          <ImageIcon className="h-3 w-3 mr-1" />
                          No
                        </Badge>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-muted-foreground">
                        {getPriorityLabel(game.priority)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/games/${game.id}`}>
                          <Button variant="ghost" size="sm">
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </Link>
                        {game.bgg_id && (
                          <a
                            href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <Button variant="ghost" size="sm">
                              <ExternalLink className="h-4 w-4" />
                            </Button>
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              No games match the selected filters
            </p>
          )}

          {/* Bottom Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-4 pt-4 border-t">
              <Link href={buildFilterUrl({ page: Math.max(1, page - 1) })}>
                <Button variant="outline" size="sm" disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4 mr-1" />
                  Previous
                </Button>
              </Link>
              <span className="text-sm text-muted-foreground px-4">
                Page {page} of {totalPages}
              </span>
              <Link href={buildFilterUrl({ page: Math.min(totalPages, page + 1) })}>
                <Button variant="outline" size="sm" disabled={page >= totalPages}>
                  Next
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
