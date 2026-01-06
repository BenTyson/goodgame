'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  ArrowLeft,
  Play,
  Clock,
  Plus,
  RefreshCw,
  AlertTriangle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  X,
  Undo2,
} from 'lucide-react'
import type { AnalyzeResult, ImportSettings, RelationGame } from './ImportWizard'

interface ImportPreviewProps {
  result: AnalyzeResult
  settings: ImportSettings
  onBack: () => void
  onStartImport: () => void
  onSettingsChange: (settings: ImportSettings) => void
}

export function ImportPreview({
  result,
  settings,
  onBack,
  onStartImport,
  onSettingsChange,
}: ImportPreviewProps) {
  const [expanded, setExpanded] = useState(result.games.length <= 10)

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `~${seconds} seconds`
    const minutes = Math.round(seconds / 60)
    return `~${minutes} minute${minutes !== 1 ? 's' : ''}`
  }

  const displayedGames = expanded ? result.games : result.games.slice(0, 10)
  const hasMore = result.games.length > 10

  const totalRelations = result.relations.expansions + result.relations.baseGames + result.relations.reimplementations

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-1">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Import Preview</h1>
            <p className="text-muted-foreground">Review what will be imported</p>
          </div>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
              <Plus className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{result.totals.new}</p>
                <p className="text-sm text-muted-foreground">New games</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{result.totals.existing}</p>
                <p className="text-sm text-muted-foreground">Will re-sync</p>
              </div>
            </div>
            {result.totals.failed > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{result.totals.failed}</p>
                  <p className="text-sm text-muted-foreground">Not found</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatTime(result.totals.estimatedSeconds)}</p>
                <p className="text-sm text-muted-foreground">Est. time</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Games List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Games ({result.games.length})</CardTitle>
              <CardDescription>Games that will be imported or re-synced</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {displayedGames.map((game) => (
            <div
              key={game.bggId}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                game.status === 'error'
                  ? 'bg-red-500/5 border-red-500/20'
                  : game.status === 'exists'
                  ? 'bg-blue-500/5 border-blue-500/20'
                  : 'bg-muted/30'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{game.name}</p>
                    {game.year && (
                      <span className="text-sm text-muted-foreground">({game.year})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <span>BGG ID: {game.bggId}</span>
                    {game.rank && <span>Rank #{game.rank}</span>}
                    {game.rating > 0 && <span>Rating: {game.rating}</span>}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {game.status === 'new' && (
                  <Badge variant="default" className="bg-green-600">NEW</Badge>
                )}
                {game.status === 'exists' && (
                  <Badge variant="secondary" className="bg-blue-600 text-white">EXISTS</Badge>
                )}
                {game.status === 'error' && (
                  <Badge variant="destructive">{game.error || 'ERROR'}</Badge>
                )}
                <a
                  href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          ))}

          {hasMore && (
            <Button
              variant="ghost"
              className="w-full"
              onClick={() => setExpanded(!expanded)}
            >
              {expanded ? (
                <>
                  <ChevronUp className="h-4 w-4 mr-2" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-4 w-4 mr-2" />
                  Show all {result.games.length} games
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Relations Card - Expandable with game list */}
      {totalRelations > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Relations to Import</CardTitle>
                <CardDescription>
                  Additional games that will be imported as relations
                  {settings.excludedBggIds.length > 0 && (
                    <span className="text-orange-500 ml-2">
                      ({settings.excludedBggIds.length} excluded)
                    </span>
                  )}
                </CardDescription>
              </div>
              {settings.excludedBggIds.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onSettingsChange({ ...settings, excludedBggIds: [] })}
                  className="text-orange-500 hover:text-orange-600"
                >
                  <Undo2 className="h-4 w-4 mr-1" />
                  Restore all
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Base Games */}
            {result.relationsDetail?.baseGames?.length > 0 && (
              <RelationSection
                title="Base games (upstream)"
                games={result.relationsDetail.baseGames}
                excludedIds={settings.excludedBggIds}
                onToggleExclude={(bggId) => {
                  const newExcluded = settings.excludedBggIds.includes(bggId)
                    ? settings.excludedBggIds.filter((id) => id !== bggId)
                    : [...settings.excludedBggIds, bggId]
                  onSettingsChange({ ...settings, excludedBggIds: newExcluded })
                }}
                badgeColor="bg-purple-500/10 text-purple-600"
              />
            )}

            {/* Expansions */}
            {result.relationsDetail?.expansions?.length > 0 && (
              <RelationSection
                title="Expansions"
                games={result.relationsDetail.expansions}
                excludedIds={settings.excludedBggIds}
                onToggleExclude={(bggId) => {
                  const newExcluded = settings.excludedBggIds.includes(bggId)
                    ? settings.excludedBggIds.filter((id) => id !== bggId)
                    : [...settings.excludedBggIds, bggId]
                  onSettingsChange({ ...settings, excludedBggIds: newExcluded })
                }}
                badgeColor="bg-cyan-500/10 text-cyan-600"
              />
            )}

            {/* Reimplementations */}
            {result.relationsDetail?.reimplementations?.length > 0 && (
              <RelationSection
                title="Reimplementations"
                games={result.relationsDetail.reimplementations}
                excludedIds={settings.excludedBggIds}
                onToggleExclude={(bggId) => {
                  const newExcluded = settings.excludedBggIds.includes(bggId)
                    ? settings.excludedBggIds.filter((id) => id !== bggId)
                    : [...settings.excludedBggIds, bggId]
                  onSettingsChange({ ...settings, excludedBggIds: newExcluded })
                }}
                badgeColor="bg-amber-500/10 text-amber-600"
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Re-sync Option */}
      {result.totals.existing > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Existing Games</CardTitle>
            <CardDescription>
              {result.totals.existing} game{result.totals.existing !== 1 ? 's' : ''} already exist in the database
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="resync">Re-sync existing games</Label>
                <p className="text-sm text-muted-foreground">
                  Update existing games with the latest data from BGG
                </p>
              </div>
              <Switch
                id="resync"
                checked={settings.resyncExisting}
                onCheckedChange={(checked) =>
                  onSettingsChange({ ...settings, resyncExisting: checked })
                }
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Cancel
        </Button>
        <Button
          onClick={onStartImport}
          disabled={result.totals.new === 0 && (!settings.resyncExisting || result.totals.existing === 0)}
          size="lg"
          className="gap-2"
        >
          <Play className="h-4 w-4" />
          Begin Import
          {(result.totals.new + (settings.resyncExisting ? result.totals.existing : 0)) > 0 && (
            <span>({result.totals.new + (settings.resyncExisting ? result.totals.existing : 0)})</span>
          )}
        </Button>
      </div>
    </div>
  )
}

// Collapsible section for relation games
function RelationSection({
  title,
  games,
  excludedIds,
  onToggleExclude,
  badgeColor,
}: {
  title: string
  games: RelationGame[]
  excludedIds: number[]
  onToggleExclude: (bggId: number) => void
  badgeColor: string
}) {
  const [isOpen, setIsOpen] = useState(false)

  const includedCount = games.filter((g) => !excludedIds.includes(g.bggId)).length
  const excludedCount = games.length - includedCount

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <div className="flex items-center justify-between p-2 bg-muted/30 rounded-lg cursor-pointer hover:bg-muted/50 transition-colors">
          <div className="flex items-center gap-2">
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{title}</span>
          </div>
          <div className="flex items-center gap-2">
            {excludedCount > 0 && (
              <Badge variant="outline" className="text-orange-500 border-orange-500/50">
                -{excludedCount}
              </Badge>
            )}
            <Badge variant="outline">+{includedCount}</Badge>
          </div>
        </div>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ScrollArea className={games.length > 8 ? 'h-64' : ''}>
          <div className="space-y-1 pt-2 pl-6">
            {games.map((game) => {
              const isExcluded = excludedIds.includes(game.bggId)
              return (
                <div
                  key={game.bggId}
                  className={`flex items-center justify-between p-2 rounded-lg border transition-colors ${
                    isExcluded
                      ? 'bg-muted/20 border-dashed border-muted-foreground/30 opacity-60'
                      : 'bg-muted/10 border-transparent hover:bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className={`text-sm truncate ${isExcluded ? 'line-through text-muted-foreground' : ''}`}>
                      {game.name}
                    </span>
                    {game.year && (
                      <span className="text-xs text-muted-foreground shrink-0">({game.year})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    <a
                      href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground p-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-7 w-7 p-0 ${isExcluded ? 'text-green-500 hover:text-green-600' : 'text-red-500 hover:text-red-600'}`}
                      onClick={() => onToggleExclude(game.bggId)}
                      title={isExcluded ? 'Include in import' : 'Exclude from import'}
                    >
                      {isExcluded ? (
                        <Undo2 className="h-3.5 w-3.5" />
                      ) : (
                        <X className="h-3.5 w-3.5" />
                      )}
                    </Button>
                  </div>
                </div>
              )
            })}
          </div>
        </ScrollArea>
      </CollapsibleContent>
    </Collapsible>
  )
}
