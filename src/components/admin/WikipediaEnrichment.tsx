'use client'

import { useState } from 'react'
import Link from 'next/link'
import {
  BookOpen,
  Loader2,
  ExternalLink,
  Link2,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'

interface ExtractedGame {
  name: string
  bggId: number | null
  year: number | null
  type: 'expansion' | 'sequel' | 'spinoff' | 'standalone' | 'related'
  notes: string | null
}

interface MatchedGame {
  extracted: ExtractedGame
  matchedGame: {
    id: string
    name: string
    bgg_id: number | null
    family_id: string | null
    slug: string
  } | null
  matchType: 'exact' | 'fuzzy' | 'bgg_id' | 'none'
  alreadyInFamily: boolean
}

interface EnrichmentResult {
  sourceGame: {
    id: string
    name: string
    wikipediaUrl: string
  }
  extraction: {
    description: string | null
    totalFound: number
  }
  matches: {
    inFamily: MatchedGame[]
    canLink: MatchedGame[]
    notInDb: MatchedGame[]
  }
  usage: {
    model: string
    tokensInput: number
    tokensOutput: number
    costUsd: number
  }
}

interface WikipediaEnrichmentProps {
  familyId: string
  familyName: string
  hasWikipediaUrl: boolean
  onGamesLinked?: () => void
}

const TYPE_COLORS: Record<string, string> = {
  expansion: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sequel: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  spinoff: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  standalone: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
  related: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
}

const MATCH_TYPE_LABELS: Record<string, string> = {
  exact: 'Exact match',
  fuzzy: 'Fuzzy match',
  bgg_id: 'BGG ID match',
  none: 'Not found',
}

export function WikipediaEnrichment({
  familyId,
  familyName,
  hasWikipediaUrl,
  onGamesLinked,
}: WikipediaEnrichmentProps) {
  const [loading, setLoading] = useState(false)
  const [linking, setLinking] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<EnrichmentResult | null>(null)
  const [selectedGameIds, setSelectedGameIds] = useState<Set<string>>(new Set())
  const [linkedCount, setLinkedCount] = useState(0)

  const fetchEnrichment = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedGameIds(new Set())

    try {
      const response = await fetch(`/api/admin/families/${familyId}/wikipedia`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch Wikipedia data')
      }

      setResult(data)

      // Auto-select all linkable games
      const linkableIds = new Set<string>(
        data.matches.canLink
          .filter((m: MatchedGame) => m.matchedGame)
          .map((m: MatchedGame) => m.matchedGame!.id)
      )
      setSelectedGameIds(linkableIds)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const toggleGameSelection = (gameId: string) => {
    setSelectedGameIds(prev => {
      const next = new Set(prev)
      if (next.has(gameId)) {
        next.delete(gameId)
      } else {
        next.add(gameId)
      }
      return next
    })
  }

  const linkSelectedGames = async () => {
    if (selectedGameIds.size === 0) return

    setLinking(true)
    try {
      const response = await fetch(`/api/admin/families/${familyId}/wikipedia`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameIds: Array.from(selectedGameIds) }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to link games')
      }

      setLinkedCount(data.linked)

      // Move linked games from canLink to inFamily
      if (result) {
        const linkedIds = selectedGameIds
        setResult({
          ...result,
          matches: {
            ...result.matches,
            inFamily: [
              ...result.matches.inFamily,
              ...result.matches.canLink.filter(m => m.matchedGame && linkedIds.has(m.matchedGame.id)),
            ],
            canLink: result.matches.canLink.filter(m => !m.matchedGame || !linkedIds.has(m.matchedGame.id)),
          },
        })
      }

      setSelectedGameIds(new Set())
      onGamesLinked?.()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to link games')
    } finally {
      setLinking(false)
    }
  }

  if (!hasWikipediaUrl) {
    return (
      <Card className="border-dashed">
        <CardContent className="pt-6">
          <div className="flex items-center gap-3 text-muted-foreground">
            <BookOpen className="h-5 w-5" />
            <div>
              <p className="font-medium">Wikipedia Enrichment</p>
              <p className="text-sm">
                No games in this family have a Wikipedia URL. Import games with Wikidata entries to enable this feature.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-purple-600" />
            </div>
            <div>
              <CardTitle className="text-lg">Wikipedia Enrichment</CardTitle>
              <CardDescription>
                Extract related games from Wikipedia articles using AI
              </CardDescription>
            </div>
          </div>
          <Button
            onClick={fetchEnrichment}
            disabled={loading}
            variant={result ? 'outline' : 'default'}
            size="sm"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : result ? (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Re-analyze
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-2" />
                Enrich from Wikipedia
              </>
            )}
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {linkedCount > 0 && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
            <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
            Successfully linked {linkedCount} game{linkedCount !== 1 ? 's' : ''} to this family
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {/* Source Info */}
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Source:</span>
              <Link
                href={result.sourceGame.wikipediaUrl}
                target="_blank"
                className="flex items-center gap-1 text-primary hover:underline"
              >
                {result.sourceGame.name}
                <ExternalLink className="h-3 w-3" />
              </Link>
              <span className="text-muted-foreground/60">|</span>
              <span>{result.extraction.totalFound} games found</span>
              <span className="text-muted-foreground/60">|</span>
              <span>${result.usage.costUsd.toFixed(4)}</span>
            </div>

            {/* Description */}
            {result.extraction.description && (
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {result.extraction.description}
              </p>
            )}

            {/* Already in Family */}
            {result.matches.inFamily.length > 0 && (
              <Collapsible defaultOpen={false}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Already in family ({result.matches.inFamily.length})
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="space-y-1 pl-6">
                    {result.matches.inFamily.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <Badge variant="outline" className={TYPE_COLORS[m.extracted.type]}>
                          {m.extracted.type}
                        </Badge>
                        <span>{m.matchedGame?.name || m.extracted.name}</span>
                        {m.extracted.year && (
                          <span className="text-muted-foreground">({m.extracted.year})</span>
                        )}
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>
            )}

            {/* Can Link */}
            {result.matches.canLink.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Link2 className="h-4 w-4 text-blue-600" />
                    Can be linked ({result.matches.canLink.length})
                  </div>
                  <Button
                    size="sm"
                    onClick={linkSelectedGames}
                    disabled={linking || selectedGameIds.size === 0}
                  >
                    {linking ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Link2 className="h-4 w-4 mr-2" />
                    )}
                    Link {selectedGameIds.size} selected
                  </Button>
                </div>
                <div className="space-y-2 pl-6">
                  {result.matches.canLink.map((m, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                    >
                      <Checkbox
                        checked={m.matchedGame ? selectedGameIds.has(m.matchedGame.id) : false}
                        onCheckedChange={() => m.matchedGame && toggleGameSelection(m.matchedGame.id)}
                      />
                      <Badge variant="outline" className={TYPE_COLORS[m.extracted.type]}>
                        {m.extracted.type}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{m.matchedGame?.name}</span>
                          {m.extracted.year && (
                            <span className="text-muted-foreground text-sm">({m.extracted.year})</span>
                          )}
                        </div>
                        {m.extracted.name !== m.matchedGame?.name && (
                          <p className="text-xs text-muted-foreground truncate">
                            Wikipedia: &quot;{m.extracted.name}&quot;
                          </p>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {MATCH_TYPE_LABELS[m.matchType]}
                      </Badge>
                      <Link href={`/admin/games/${m.matchedGame?.id}`} target="_blank">
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ExternalLink className="h-3 w-3" />
                        </Button>
                      </Link>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Not in DB */}
            {result.matches.notInDb.length > 0 && (
              <Collapsible defaultOpen={result.matches.canLink.length === 0}>
                <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
                  <HelpCircle className="h-4 w-4 text-amber-600" />
                  Not in database ({result.matches.notInDb.length})
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-2">
                  <div className="space-y-1 pl-6">
                    {result.matches.notInDb.map((m, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Badge variant="outline" className={TYPE_COLORS[m.extracted.type]}>
                          {m.extracted.type}
                        </Badge>
                        <span>{m.extracted.name}</span>
                        {m.extracted.year && (
                          <span>({m.extracted.year})</span>
                        )}
                        {m.extracted.notes && (
                          <span className="text-xs italic">- {m.extracted.notes}</span>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2 pl-6">
                    Import these games via the Import page to add them to this family.
                  </p>
                </CollapsibleContent>
              </Collapsible>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
