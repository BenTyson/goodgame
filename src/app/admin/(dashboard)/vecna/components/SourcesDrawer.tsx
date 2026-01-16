'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { VecnaGame } from '@/lib/vecna'

interface SourcesDrawerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  game: VecnaGame | null
}

// Expandable text for long content
function ExpandableText({ text, className }: { text: string; className?: string }) {
  const [isExpanded, setIsExpanded] = useState(false)
  const isLong = text.length > 300

  return (
    <div className={className}>
      <p className={cn('text-sm text-muted-foreground whitespace-pre-wrap', !isExpanded && isLong && 'line-clamp-4')}>
        {text}
      </p>
      {isLong && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="text-xs text-primary hover:underline mt-1"
        >
          {isExpanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  )
}

function DataField({ label, value, className }: { label: string; value: React.ReactNode; className?: string }) {
  if (!value) return null
  return (
    <div className={cn('flex justify-between py-1 border-b border-border/50 last:border-0', className)}>
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  )
}

export function SourcesDrawer({ open, onOpenChange, game }: SourcesDrawerProps) {
  const router = useRouter()
  const [isResyncing, setIsResyncing] = useState(false)
  const [resyncStatus, setResyncStatus] = useState<{
    success: boolean
    message: string
  } | null>(null)

  const handleResyncWikipedia = async () => {
    if (!game) return

    setIsResyncing(true)
    setResyncStatus(null)

    try {
      const response = await fetch(`/api/admin/games/${game.id}/resync-wikipedia`, {
        method: 'POST',
      })

      const data = await response.json()

      if (data.success) {
        const updated = Object.entries(data.updated)
          .filter(([, v]) => v)
          .map(([k]) => k)
        setResyncStatus({
          success: true,
          message: updated.length > 0
            ? `Updated: ${updated.join(', ')}`
            : 'Re-synced (no new data found)',
        })
        // Refresh the page data
        router.refresh()
      } else {
        setResyncStatus({
          success: false,
          message: data.error || 'Re-sync failed',
        })
      }
    } catch (error) {
      setResyncStatus({
        success: false,
        message: error instanceof Error ? error.message : 'Re-sync failed',
      })
    } finally {
      setIsResyncing(false)
    }
  }

  if (!game) return null

  const bgg = game.bgg_raw_data

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-[500px] sm:w-[600px] overflow-hidden flex flex-col">
        <SheetHeader>
          <SheetTitle>Debug Sources: {game.name}</SheetTitle>
          <SheetDescription>
            Raw data from all sources for comparison
          </SheetDescription>
        </SheetHeader>

        <Tabs defaultValue="bgg" className="flex-1 flex flex-col mt-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="bgg">BGG</TabsTrigger>
            <TabsTrigger value="wikipedia">Wikipedia</TabsTrigger>
            <TabsTrigger value="wikidata">Wikidata</TabsTrigger>
            <TabsTrigger value="current">Current</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 mt-4">
            {/* BGG Tab */}
            <TabsContent value="bgg" className="mt-0 space-y-4">
              {bgg ? (
                <>
                  <div className="space-y-1">
                    <h4 className="font-medium text-sm">Basic Info</h4>
                    <DataField label="Name" value={bgg.name} />
                    <DataField label="Year" value={bgg.yearpublished} />
                    <DataField label="Players" value={`${bgg.minplayers}-${bgg.maxplayers}`} />
                    <DataField label="Playtime" value={`${bgg.minplaytime}-${bgg.maxplaytime} min`} />
                    <DataField label="Min Age" value={bgg.minAge} />
                    <DataField label="Weight" value={bgg.weight != null ? Number(bgg.weight).toFixed(2) : undefined} />
                    <DataField label="Rating" value={bgg.rating != null ? Number(bgg.rating).toFixed(2) : undefined} />
                    <DataField label="Rank" value={bgg.rank} />
                  </div>

                  {bgg.alternateNames && bgg.alternateNames.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Alternate Names</h4>
                      <div className="flex flex-wrap gap-1">
                        {bgg.alternateNames.map((name, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {bgg.designers && bgg.designers.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Designers</h4>
                      <p className="text-sm text-muted-foreground">{bgg.designers.join(', ')}</p>
                    </div>
                  )}

                  {bgg.publishers && bgg.publishers.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Publishers</h4>
                      <p className="text-sm text-muted-foreground">{bgg.publishers.slice(0, 5).join(', ')}</p>
                    </div>
                  )}

                  {bgg.categories && bgg.categories.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Categories</h4>
                      <div className="flex flex-wrap gap-1">
                        {bgg.categories.map((cat, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{cat}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {bgg.mechanics && bgg.mechanics.length > 0 && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Mechanics</h4>
                      <div className="flex flex-wrap gap-1">
                        {bgg.mechanics.map((mech, i) => (
                          <Badge key={i} variant="secondary" className="text-xs">{mech}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {bgg.description && (
                    <div className="space-y-1">
                      <h4 className="font-medium text-sm">Description</h4>
                      <ExpandableText text={bgg.description} />
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No BGG data available
                </div>
              )}
            </TabsContent>

            {/* Wikipedia Tab */}
            <TabsContent value="wikipedia" className="mt-0 space-y-4">
              {/* Resync Button */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResyncWikipedia}
                  disabled={isResyncing || !game.wikipedia_url}
                  className="gap-2"
                >
                  <RefreshCw className={cn('h-4 w-4', isResyncing && 'animate-spin')} />
                  {isResyncing ? 'Re-syncing...' : 'Re-sync Wikipedia'}
                </Button>
                {!game.wikipedia_url && (
                  <span className="text-xs text-muted-foreground">No Wikipedia URL</span>
                )}
              </div>

              {/* Resync Status */}
              {resyncStatus && (
                <div
                  className={cn(
                    'p-3 rounded-lg flex items-start gap-2 text-sm',
                    resyncStatus.success
                      ? 'bg-green-50 border border-green-200 text-green-700'
                      : 'bg-red-50 border border-red-200 text-red-700'
                  )}
                >
                  {resyncStatus.success ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  )}
                  <span>{resyncStatus.message}</span>
                </div>
              )}

              {game.wikipedia_summary && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">AI Summary</h4>
                  <ExpandableText text={game.wikipedia_summary.summary || ''} />
                </div>
              )}

              {game.wikipedia_infobox && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">Infobox Data</h4>
                  <DataField label="Designer" value={game.wikipedia_infobox.designer?.join(', ')} />
                  <DataField label="Publisher" value={game.wikipedia_infobox.publisher?.join(', ')} />
                  <DataField label="Players" value={game.wikipedia_infobox.players} />
                  <DataField label="Playing Time" value={game.wikipedia_infobox.playingTime} />
                  <DataField label="Ages" value={game.wikipedia_infobox.ages} />
                  <DataField label="Series" value={game.wikipedia_infobox.series} />
                </div>
              )}

              {game.wikipedia_gameplay && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">Gameplay Section</h4>
                  <ExpandableText text={game.wikipedia_gameplay} />
                </div>
              )}

              {game.wikipedia_origins && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">Origins</h4>
                  <ExpandableText text={game.wikipedia_origins} />
                </div>
              )}

              {game.wikipedia_reception && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">Reception</h4>
                  <ExpandableText text={game.wikipedia_reception} />
                </div>
              )}

              {game.wikipedia_awards && game.wikipedia_awards.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">Awards</h4>
                  <div className="space-y-1">
                    {game.wikipedia_awards.map((award, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge
                          variant="outline"
                          className={cn(
                            'text-xs',
                            award.result === 'winner' && 'bg-yellow-50 text-yellow-700',
                            award.result === 'nominated' && 'bg-blue-50 text-blue-700'
                          )}
                        >
                          {award.result}
                        </Badge>
                        <span>{award.name}</span>
                        {award.year && <span className="text-muted-foreground">({award.year})</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {game.wikipedia_external_links && game.wikipedia_external_links.length > 0 && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">External Links</h4>
                  <div className="space-y-1">
                    {game.wikipedia_external_links.map((link, i) => (
                      <a
                        key={i}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-sm text-primary hover:underline"
                      >
                        <Badge variant="secondary" className="text-xs">{link.type}</Badge>
                        <span className="truncate">{link.url}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {!game.wikipedia_summary && !game.wikipedia_infobox && !game.wikipedia_gameplay && (
                <div className="text-center py-8 text-muted-foreground">
                  No Wikipedia data available
                </div>
              )}
            </TabsContent>

            {/* Wikidata Tab */}
            <TabsContent value="wikidata" className="mt-0 space-y-4">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Wikidata Properties</h4>
                <DataField label="Wikidata ID" value={game.wikidata_id} />
                <DataField label="Official Website" value={game.official_website} />
                <DataField label="Series ID" value={game.wikidata_series_id} />
                <DataField label="Has CC Image" value={game.wikidata_image_url ? 'Yes' : 'No'} />
              </div>

              {game.wikidata_image_url && (
                <div className="space-y-1">
                  <h4 className="font-medium text-sm">Wikidata CC Image</h4>
                  <img
                    src={game.wikidata_image_url}
                    alt="Wikidata CC"
                    className="max-w-full rounded"
                  />
                </div>
              )}

              {!game.wikidata_id && (
                <div className="text-center py-8 text-muted-foreground">
                  No Wikidata data available
                </div>
              )}
            </TabsContent>

            {/* Current Values Tab */}
            <TabsContent value="current" className="mt-0 space-y-4">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">Current Game Values</h4>
                <DataField label="Year Published" value={game.year_published} />
                <DataField label="Players" value={`${game.player_count_min}-${game.player_count_max}`} />
                <DataField label="Playtime" value={`${game.play_time_min}-${game.play_time_max} min`} />
                <DataField label="Min Age" value={game.min_age} />
                <DataField label="BGG Weight" value={game.weight?.toFixed(2)} />
                <DataField label="Crunch Score" value={game.crunch_score?.toFixed(1)} />
              </div>

              <div className="space-y-1">
                <h4 className="font-medium text-sm">Data Freshness</h4>
                <DataField
                  label="BGG Synced"
                  value={game.bgg_last_synced ? new Date(game.bgg_last_synced).toLocaleDateString() : '-'}
                />
                <DataField
                  label="Wikidata Synced"
                  value={game.wikidata_last_synced ? new Date(game.wikidata_last_synced).toLocaleDateString() : '-'}
                />
                <DataField
                  label="Wikipedia Fetched"
                  value={game.wikipedia_fetched_at ? new Date(game.wikipedia_fetched_at).toLocaleDateString() : '-'}
                />
                <DataField
                  label="Content Generated"
                  value={game.content_generated_at ? new Date(game.content_generated_at).toLocaleDateString() : '-'}
                />
              </div>

              <div className="space-y-1">
                <h4 className="font-medium text-sm">Processing State</h4>
                <DataField label="Vecna State" value={game.vecna_state} />
                <DataField
                  label="Last Processed"
                  value={game.vecna_processed_at ? new Date(game.vecna_processed_at).toLocaleString() : '-'}
                />
                {game.vecna_error && (
                  <div className="p-2 bg-red-50 rounded text-sm text-red-700 mt-2">
                    {game.vecna_error}
                  </div>
                )}
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  )
}
