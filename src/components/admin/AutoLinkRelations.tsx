'use client'

import { useState } from 'react'
import {
  Sparkles,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Link2,
  ExternalLink,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { RelationType } from '@/types/database'

interface GameInfo {
  id: string
  name: string
  year_published: number | null
  bgg_id: number | null
}

interface MatchedRelation {
  sourceGame: GameInfo
  targetGame: GameInfo
  relationType: RelationType
  confidence: 'high' | 'medium' | 'low'
  reason: string
  alreadyExists: boolean
}

interface AutoLinkResult {
  sourceArticle: {
    name: string
    url: string
  }
  relations: {
    new: MatchedRelation[]
    existing: MatchedRelation[]
  }
  stats: {
    totalGames: number
    extractedRelations: number
    matchedNew: number
    matchedExisting: number
  }
  usage: {
    model: string
    tokensInput: number
    tokensOutput: number
    costUsd: number
  }
}

interface AutoLinkRelationsProps {
  familyId: string
  unlinkedCount: number
  hasWikipediaUrl: boolean
  onRelationsCreated?: () => void
}

const RELATION_LABELS: Record<RelationType, string> = {
  expansion_of: 'Expansion of',
  base_game_of: 'Base game of',
  sequel_to: 'Sequel to',
  prequel_to: 'Prequel to',
  reimplementation_of: 'Reimplementation of',
  spin_off_of: 'Spin-off of',
  standalone_in_series: 'Standalone with',
  promo_of: 'Promo for',
}

const RELATION_COLORS: Record<string, string> = {
  expansion_of: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  sequel_to: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  reimplementation_of: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  spin_off_of: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  standalone_in_series: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
}

const CONFIDENCE_COLORS: Record<string, string> = {
  high: 'text-green-600',
  medium: 'text-amber-600',
  low: 'text-red-600',
}

export function AutoLinkRelations({
  familyId,
  unlinkedCount,
  hasWikipediaUrl,
  onRelationsCreated,
}: AutoLinkRelationsProps) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<AutoLinkResult | null>(null)
  const [selectedRelations, setSelectedRelations] = useState<Set<string>>(new Set())
  const [createdCount, setCreatedCount] = useState(0)

  const analyzeRelations = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setSelectedRelations(new Set())

    try {
      const response = await fetch(`/api/admin/families/${familyId}/auto-link`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze relations')
      }

      setResult(data)

      // Auto-select high confidence relations
      const highConfidence = new Set<string>(
        data.relations.new
          .filter((r: MatchedRelation) => r.confidence === 'high')
          .map((r: MatchedRelation) => `${r.sourceGame.id}-${r.targetGame.id}-${r.relationType}`)
      )
      setSelectedRelations(highConfidence)

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const toggleRelation = (rel: MatchedRelation) => {
    const key = `${rel.sourceGame.id}-${rel.targetGame.id}-${rel.relationType}`
    setSelectedRelations(prev => {
      const next = new Set(prev)
      if (next.has(key)) {
        next.delete(key)
      } else {
        next.add(key)
      }
      return next
    })
  }

  const createRelations = async () => {
    if (selectedRelations.size === 0 || !result) return

    setCreating(true)
    try {
      const relationsToCreate = result.relations.new
        .filter(r => selectedRelations.has(`${r.sourceGame.id}-${r.targetGame.id}-${r.relationType}`))
        .map(r => ({
          sourceGameId: r.sourceGame.id,
          targetGameId: r.targetGame.id,
          relationType: r.relationType,
        }))

      const response = await fetch(`/api/admin/families/${familyId}/auto-link`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relations: relationsToCreate }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create relations')
      }

      setCreatedCount(data.created)

      // Move created relations to existing
      if (result) {
        const createdKeys = new Set(
          relationsToCreate.map(r => `${r.sourceGameId}-${r.targetGameId}-${r.relationType}`)
        )
        setResult({
          ...result,
          relations: {
            new: result.relations.new.filter(r =>
              !createdKeys.has(`${r.sourceGame.id}-${r.targetGame.id}-${r.relationType}`)
            ),
            existing: [
              ...result.relations.existing,
              ...result.relations.new.filter(r =>
                createdKeys.has(`${r.sourceGame.id}-${r.targetGame.id}-${r.relationType}`)
              ).map(r => ({ ...r, alreadyExists: true })),
            ],
          },
        })
      }

      setSelectedRelations(new Set())
      onRelationsCreated?.()

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create relations')
    } finally {
      setCreating(false)
    }
  }

  if (!hasWikipediaUrl) {
    return null
  }

  if (unlinkedCount === 0) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Sparkles className="h-4 w-4" />
          Auto-Link with AI
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-purple-600" />
            Auto-Link Relations
          </DialogTitle>
          <DialogDescription>
            Use AI to analyze Wikipedia and suggest relationships between unlinked games.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {error && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {createdCount > 0 && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 text-green-700 dark:text-green-400 text-sm">
              <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
              Created {createdCount} relation{createdCount !== 1 ? 's' : ''}
            </div>
          )}

          {!result && !loading && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                Analyze {unlinkedCount} unlinked game{unlinkedCount !== 1 ? 's' : ''} to suggest relationships.
              </p>
              <Button onClick={analyzeRelations}>
                <Sparkles className="h-4 w-4 mr-2" />
                Analyze with AI
              </Button>
            </div>
          )}

          {loading && (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">Analyzing Wikipedia article...</p>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {/* Source info */}
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Source:</span>
                <a
                  href={result.sourceArticle.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-primary hover:underline"
                >
                  {result.sourceArticle.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
                <span className="text-muted-foreground/60">|</span>
                <span>${result.usage.costUsd.toFixed(4)}</span>
              </div>

              {/* New relations to create */}
              {result.relations.new.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium flex items-center gap-2">
                      <Link2 className="h-4 w-4 text-blue-600" />
                      Suggested Relations ({result.relations.new.length})
                    </h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const allKeys = new Set(
                          result.relations.new.map(r =>
                            `${r.sourceGame.id}-${r.targetGame.id}-${r.relationType}`
                          )
                        )
                        setSelectedRelations(
                          selectedRelations.size === allKeys.size ? new Set() : allKeys
                        )
                      }}
                    >
                      {selectedRelations.size === result.relations.new.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {result.relations.new.map((rel, i) => {
                      const key = `${rel.sourceGame.id}-${rel.targetGame.id}-${rel.relationType}`
                      const isSelected = selectedRelations.has(key)

                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                            isSelected ? 'bg-primary/5 border-primary/30' : 'hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => toggleRelation(rel)}
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-medium truncate">{rel.sourceGame.name}</span>
                              <Badge variant="outline" className={RELATION_COLORS[rel.relationType] || ''}>
                                {RELATION_LABELS[rel.relationType] || rel.relationType}
                              </Badge>
                              <ArrowRight className="h-3 w-3 text-muted-foreground flex-shrink-0" />
                              <span className="truncate">{rel.targetGame.name}</span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1 truncate">
                              {rel.reason}
                            </p>
                          </div>
                          <Badge
                            variant="outline"
                            className={`text-xs ${CONFIDENCE_COLORS[rel.confidence]}`}
                          >
                            {rel.confidence}
                          </Badge>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Already existing relations */}
              {result.relations.existing.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-medium flex items-center gap-2 text-muted-foreground">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    Already Exists ({result.relations.existing.length})
                  </h4>
                  <div className="space-y-1 text-sm text-muted-foreground">
                    {result.relations.existing.map((rel, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span>{rel.sourceGame.name}</span>
                        <ArrowRight className="h-3 w-3" />
                        <span>{rel.targetGame.name}</span>
                        <span className="text-xs">({rel.relationType.replace(/_/g, ' ')})</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {result.relations.new.length === 0 && result.relations.existing.length === 0 && (
                <div className="text-center py-4 text-muted-foreground">
                  No relationships could be determined from the Wikipedia article.
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Close
          </Button>
          {result && result.relations.new.length > 0 && (
            <Button
              onClick={createRelations}
              disabled={creating || selectedRelations.size === 0}
            >
              {creating ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Link2 className="h-4 w-4 mr-2" />
              )}
              Create {selectedRelations.size} Relation{selectedRelations.size !== 1 ? 's' : ''}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
