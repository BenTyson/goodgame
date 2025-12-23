import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ExternalLink, RefreshCw } from 'lucide-react'
import { getQueueSummary } from '@/lib/bgg/seed-queue'

async function getQueueItems(filter?: string) {
  const supabase = await createClient()

  let query = supabase
    .from('import_queue')
    .select('*')
    .order('priority', { ascending: true })
    .order('created_at', { ascending: true })

  if (filter && filter !== 'all') {
    query = query.eq('status', filter)
  }

  const { data } = await query.limit(100)

  return data || []
}

export default async function AdminQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>
}) {
  const { filter } = await searchParams
  const [items, summary] = await Promise.all([
    getQueueItems(filter),
    getQueueSummary(),
  ])

  const filters = [
    { label: 'All', value: 'all', count: summary.total },
    { label: 'Pending', value: 'pending', count: summary.byStatus['pending'] || 0 },
    { label: 'Importing', value: 'importing', count: summary.byStatus['importing'] || 0 },
    { label: 'Imported', value: 'imported', count: summary.byStatus['imported'] || 0 },
    { label: 'Failed', value: 'failed', count: summary.byStatus['failed'] || 0 },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Import Queue</h1>
          <p className="text-muted-foreground">BGG game import pipeline</p>
        </div>
      </div>

      {/* Queue Summary */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>By Source</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">BGG Top 500</span>
                <span>{summary.bySource['bgg_top500'] || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Award Winners</span>
                <span>{summary.bySource['award_winner'] || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Manual</span>
                <span>{summary.bySource['manual'] || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>By Status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Pending</span>
                <span>{summary.byStatus['pending'] || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Imported</span>
                <span className="text-green-600">{summary.byStatus['imported'] || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Failed</span>
                <span className="text-destructive">{summary.byStatus['failed'] || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total</CardDescription>
            <CardTitle className="text-3xl">{summary.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Items in queue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {filters.map((f) => (
          <Link
            key={f.value}
            href={f.value === 'all' ? '/admin/queue' : `/admin/queue?filter=${f.value}`}
          >
            <Button
              variant={filter === f.value || (!filter && f.value === 'all') ? 'default' : 'outline'}
              size="sm"
            >
              {f.label} ({f.count})
            </Button>
          </Link>
        ))}
      </div>

      {/* Queue Table */}
      <Card>
        <CardHeader>
          <CardTitle>Queue Items ({items.length})</CardTitle>
          <CardDescription>
            Games waiting to be imported from BoardGameGeek
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="relative overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase bg-muted/50">
                <tr>
                  <th className="px-4 py-3 text-left">BGG ID</th>
                  <th className="px-4 py-3 text-left">Name</th>
                  <th className="px-4 py-3 text-left">Source</th>
                  <th className="px-4 py-3 text-left">Priority</th>
                  <th className="px-4 py-3 text-left">Status</th>
                  <th className="px-4 py-3 text-left">Attempts</th>
                  <th className="px-4 py-3 text-left">Error</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item) => (
                  <tr key={item.id} className="border-b">
                    <td className="px-4 py-3">
                      <a
                        href={`https://boardgamegeek.com/boardgame/${item.bgg_id}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        {item.bgg_id}
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="px-4 py-3">
                      {item.name || '-'}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-1 rounded-full bg-muted">
                        {item.source}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.priority}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          item.status === 'imported'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : item.status === 'failed'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            : item.status === 'importing'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                            : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {item.attempts || 0}
                    </td>
                    <td className="px-4 py-3">
                      {item.error_message ? (
                        <span className="text-xs text-destructive truncate max-w-[200px] block">
                          {item.error_message}
                        </span>
                      ) : (
                        '-'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {items.length === 0 && (
            <p className="text-center py-8 text-muted-foreground">
              No items in queue
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
