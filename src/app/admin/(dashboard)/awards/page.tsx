'use client'

import { useState, useEffect } from 'react'
import { Trophy, Download, Loader2, CheckCircle, AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'

// Awards available for import from Wikidata
const WIKIDATA_AWARDS = [
  { slug: 'spiel-des-jahres', name: 'Spiel des Jahres' },
  { slug: 'kennerspiel-des-jahres', name: 'Kennerspiel des Jahres' },
  { slug: 'kinderspiel-des-jahres', name: 'Kinderspiel des Jahres' },
  { slug: 'deutscher-spiele-preis', name: 'Deutscher Spiele Preis' },
  { slug: 'as-dor', name: "As d'Or" },
  { slug: 'origins-awards', name: 'Origins Award' },
  { slug: 'golden-geek', name: 'Golden Geek Award' },
  { slug: 'international-gamers-award', name: 'International Gamers Award' },
]

interface AwardStats {
  total: number
  linked: number
  pending: number
  byAward: Array<{
    slug: string
    name: string
    linked: number
    pending: number
  }>
}

interface ImportResult {
  success: boolean
  total: number
  imported: number
  linked: number
  pending: number
  skipped: number
  errors: string[]
  awardSlug?: string
}

export default function AdminAwardsPage() {
  const [stats, setStats] = useState<AwardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [importingAward, setImportingAward] = useState<string | null>(null)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchStats = async () => {
    try {
      setLoading(true)
      const res = await fetch('/api/admin/awards/import-wikidata')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async (awardSlug?: string) => {
    try {
      setImportingAward(awardSlug || 'all')
      setImportResult(null)
      setError(null)

      const url = awardSlug
        ? `/api/admin/awards/import-wikidata?award=${awardSlug}`
        : '/api/admin/awards/import-wikidata'

      const res = await fetch(url, { method: 'POST' })

      if (!res.ok) throw new Error('Import failed')

      const result = await res.json()
      setImportResult({ ...result, awardSlug })

      // Refresh stats after import
      await fetchStats()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
    } finally {
      setImportingAward(null)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  // Get stats for a specific award
  const getAwardStats = (slug: string) => {
    return stats?.byAward.find((a) => a.slug === slug)
  }

  return (
    <div className="container py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-primary" />
            Award Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Import board game awards from Wikidata
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={fetchStats}
          disabled={loading || !!importingAward}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="mb-6 border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Result */}
      {importResult && (
        <Card className="mb-6 border-green-500">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Import Complete
              {importResult.awardSlug && (
                <span className="text-sm font-normal text-muted-foreground">
                  ({WIKIDATA_AWARDS.find((a) => a.slug === importResult.awardSlug)?.name || importResult.awardSlug})
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold">{importResult.total}</div>
                <div className="text-xs text-muted-foreground">From Wikidata</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">{importResult.imported}</div>
                <div className="text-xs text-muted-foreground">Imported</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-600">{importResult.linked}</div>
                <div className="text-xs text-muted-foreground">Linked to Games</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-amber-600">{importResult.pending}</div>
                <div className="text-xs text-muted-foreground">Pending</div>
              </div>
            </div>
            {importResult.errors.length > 0 && (
              <div className="mt-4 p-3 bg-destructive/10 rounded-lg">
                <div className="text-sm font-medium text-destructive mb-2">
                  {importResult.errors.length} errors:
                </div>
                <ul className="text-xs text-destructive/80 space-y-1 max-h-32 overflow-auto">
                  {importResult.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li>... and {importResult.errors.length - 10} more</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Stats Overview */}
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Database Statistics</CardTitle>
          <CardDescription>Overview of awards currently in the database</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : stats ? (
            <>
              <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-3xl font-bold">{stats.total}</div>
                  <div className="text-sm text-muted-foreground">Total Awards</div>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-green-600">{stats.linked}</div>
                  <div className="text-sm text-muted-foreground">Linked to Games</div>
                </div>
                <div className="p-4 bg-amber-500/10 rounded-lg">
                  <div className="text-3xl font-bold text-amber-600">{stats.pending}</div>
                  <div className="text-sm text-muted-foreground">Pending</div>
                </div>
              </div>

              {stats.total > 0 && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Games Coverage</span>
                    <span>{Math.round((stats.linked / stats.total) * 100)}%</span>
                  </div>
                  <Progress value={(stats.linked / stats.total) * 100} />
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">No stats available</div>
          )}
        </CardContent>
      </Card>

      {/* Import by Award */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Import from Wikidata</CardTitle>
          <CardDescription>Select an award to import winners from Wikidata</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {WIKIDATA_AWARDS.map((award) => {
              const awardStats = getAwardStats(award.slug)
              const total = awardStats ? awardStats.linked + awardStats.pending : 0
              const isImporting = importingAward === award.slug

              return (
                <div
                  key={award.slug}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{award.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {awardStats ? (
                        <>
                          <span className="text-green-600">{awardStats.linked} linked</span>
                          {awardStats.pending > 0 && (
                            <>
                              <span className="mx-1">/</span>
                              <span className="text-amber-600">{awardStats.pending} pending</span>
                            </>
                          )}
                          {total === 0 && <span>No data imported yet</span>}
                        </>
                      ) : (
                        <span>No data imported yet</span>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={total > 0 ? 'outline' : 'default'}
                    onClick={() => handleImport(award.slug)}
                    disabled={!!importingAward}
                  >
                    {isImporting ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Importing...
                      </>
                    ) : (
                      <>
                        <Download className="mr-2 h-3 w-3" />
                        {total > 0 ? 'Refresh' : 'Import'}
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>

          {/* Import All */}
          <div className="mt-6 pt-4 border-t">
            <Button
              variant="outline"
              className="w-full"
              onClick={() => handleImport()}
              disabled={!!importingAward}
            >
              {importingAward === 'all' ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Importing All Awards...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Import All Awards
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
