'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { SwitchField } from '@/components/admin'
import {
  ExternalLink,
  CheckCircle2,
  Workflow,
  AlertCircle,
  Loader2,
  Play,
  ShoppingCart,
  Pencil,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CrunchScoreDisplay } from '@/components/admin/rulebook'
import { EntitySelector } from './EntitySelector'
import type { CrunchBreakdown } from '@/lib/rulebook/types'
import type { LinkedEntity } from '@/lib/supabase/game-queries'
import { VECNA_STATE_CONFIG, type VecnaState } from '@/lib/vecna/types'
import { formatDate } from '@/lib/admin/utils'
import type { Game } from '@/types/database'

interface DetailsTabProps {
  game: Game
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
  // Linked entities
  designers: LinkedEntity[]
  publishers: LinkedEntity[]
  artists: LinkedEntity[]
  onDesignersChange: (entities: LinkedEntity[]) => void
  onPublishersChange: (entities: LinkedEntity[]) => void
  onArtistsChange: (entities: LinkedEntity[]) => void
}

// Helper to get state badge styling
function getStateBadgeClass(state: VecnaState): string {
  const config = VECNA_STATE_CONFIG[state]
  if (!config) return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'

  // Map state to appropriate badge colors
  switch (state) {
    case 'published':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'review_pending':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'generated':
    case 'generating':
      return 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400'
    case 'parsed':
    case 'parsing':
    case 'taxonomy_assigned':
      return 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
    case 'rulebook_ready':
      return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    case 'rulebook_missing':
      return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
    case 'enriched':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    case 'imported':
    default:
      return 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
  }
}

export function DetailsTab({
  game,
  updateField,
  designers,
  publishers,
  artists,
  onDesignersChange,
  onPublishersChange,
  onArtistsChange,
}: DetailsTabProps) {
  const vecnaState = (game.vecna_state as VecnaState) || 'imported'
  const stateConfig = VECNA_STATE_CONFIG[vecnaState]
  const isProcessing = vecnaState === 'parsing' || vecnaState === 'generating'

  return (
    <div className="space-y-6">
      {/* Game Details - Combined Identity, Players & Time, Metadata */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Pencil className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Game Details</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Core information, player counts, and metadata</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Identity Section */}
          <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="uppercase tracking-wider text-xs text-primary">Game Name</Label>
                <Input
                  id="name"
                  value={game.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="e.g., Catan"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug" className="uppercase tracking-wider text-xs text-primary">URL Slug</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">/games/</span>
                  <Input
                    id="slug"
                    value={game.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                    className="pl-16"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tagline" className="uppercase tracking-wider text-xs text-primary">Tagline</Label>
              <Input
                id="tagline"
                value={game.tagline || ''}
                onChange={(e) => updateField('tagline', e.target.value)}
                placeholder="A short catchy description that appears on cards"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="uppercase tracking-wider text-xs text-primary">Full Description</Label>
              <AutoResizeTextarea
                id="description"
                value={game.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                minRows={3}
                maxRows={20}
                placeholder="Detailed description of the game..."
              />
            </div>
          </div>

          {/* Players & Time Section */}
          <div className="pt-4 border-t-4 border-primary/30">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="player_min" className="uppercase tracking-wider text-xs text-primary">Min Players</Label>
                <Input
                  id="player_min"
                  type="number"
                  min="1"
                  value={game.player_count_min}
                  onChange={(e) => updateField('player_count_min', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="player_max" className="uppercase tracking-wider text-xs text-primary">Max Players</Label>
                <Input
                  id="player_max"
                  type="number"
                  min="1"
                  value={game.player_count_max}
                  onChange={(e) => updateField('player_count_max', parseInt(e.target.value) || 1)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_min" className="uppercase tracking-wider text-xs text-primary">Min Time</Label>
                <div className="relative">
                  <Input
                    id="time_min"
                    type="number"
                    min="1"
                    value={game.play_time_min || ''}
                    onChange={(e) => updateField('play_time_min', parseInt(e.target.value) || null)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">min</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="time_max" className="uppercase tracking-wider text-xs text-primary">Max Time</Label>
                <div className="relative">
                  <Input
                    id="time_max"
                    type="number"
                    min="1"
                    value={game.play_time_max || ''}
                    onChange={(e) => updateField('play_time_max', parseInt(e.target.value) || null)}
                    className="pr-12"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">min</span>
                </div>
              </div>
            </div>
          </div>

          {/* Metadata Section */}
          <div className="space-y-4 pt-4 border-t-4 border-primary/30">
            {/* Crunch Score Display (read-only, AI-generated) */}
            {game.crunch_score != null && (
              <CrunchScoreDisplay
                score={Number(game.crunch_score)}
                breakdown={game.crunch_breakdown as CrunchBreakdown | null}
                generatedAt={game.crunch_generated_at}
                bggReference={game.crunch_bgg_reference ? Number(game.crunch_bgg_reference) : undefined}
                compact
              />
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="weight" className="uppercase tracking-wider text-xs text-primary">BGG Weight</Label>
                <Input
                  id="weight"
                  type="number"
                  step="0.1"
                  min="1"
                  max="5"
                  value={game.weight || ''}
                  onChange={(e) => updateField('weight', parseFloat(e.target.value) || null)}
                  placeholder="1.0 - 5.0"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="min_age" className="uppercase tracking-wider text-xs text-primary">Min Age</Label>
                <div className="relative">
                  <Input
                    id="min_age"
                    type="number"
                    min="1"
                    value={game.min_age || ''}
                    onChange={(e) => updateField('min_age', parseInt(e.target.value) || null)}
                    className="pr-8"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">+</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year" className="uppercase tracking-wider text-xs text-primary">Year Published</Label>
                <Input
                  id="year"
                  type="number"
                  value={game.year_published || ''}
                  onChange={(e) => updateField('year_published', parseInt(e.target.value) || null)}
                  placeholder="2024"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bgg_id" className="uppercase tracking-wider text-xs text-primary">BGG ID</Label>
                <div className="flex gap-2">
                  <Input
                    id="bgg_id"
                    type="number"
                    value={game.bgg_id || ''}
                    onChange={(e) => updateField('bgg_id', parseInt(e.target.value) || null)}
                  />
                  {game.bgg_id && (
                    <a
                      href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button variant="outline" size="icon" className="shrink-0">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            </div>

            {/* Linked Entities: Publishers, Designers, Artists */}
            <div className="grid sm:grid-cols-3 gap-4">
              <EntitySelector
                type="publishers"
                label="Publishers"
                value={publishers}
                onChange={onPublishersChange}
                placeholder="Search publishers..."
              />
              <EntitySelector
                type="designers"
                label="Designers"
                value={designers}
                onChange={onDesignersChange}
                placeholder="Search designers..."
              />
              <EntitySelector
                type="artists"
                label="Artists"
                value={artists}
                onChange={onArtistsChange}
                placeholder="Search artists..."
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Collection Tags */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Collection Tags</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Feature flags for homepage collections</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            <SwitchField
              label="Featured"
              description="Homepage feature"
              checked={game.is_featured || false}
              onCheckedChange={(checked) => updateField('is_featured', checked)}
              compact
            />
            <SwitchField
              label="Trending"
              description="Currently popular"
              checked={game.is_trending || false}
              onCheckedChange={(checked) => updateField('is_trending', checked)}
              compact
            />
            <SwitchField
              label="Top Rated"
              description="Highest rated"
              checked={game.is_top_rated || false}
              onCheckedChange={(checked) => updateField('is_top_rated', checked)}
              compact
            />
            <SwitchField
              label="Staff Pick"
              description="Team recommendation"
              checked={game.is_staff_pick || false}
              onCheckedChange={(checked) => updateField('is_staff_pick', checked)}
              compact
            />
            <SwitchField
              label="Hidden Gem"
              description="Underrated"
              checked={game.is_hidden_gem || false}
              onCheckedChange={(checked) => updateField('is_hidden_gem', checked)}
              compact
            />
            <SwitchField
              label="New Release"
              description="Recently released"
              checked={game.is_new_release || false}
              onCheckedChange={(checked) => updateField('is_new_release', checked)}
              compact
            />
          </div>
        </CardContent>
      </Card>

      {/* External References */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ShoppingCart className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">External References</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Amazon and other external links</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Label htmlFor="amazon_asin" className="uppercase tracking-wider text-xs text-primary">Amazon ASIN</Label>
            <div className="flex gap-2">
              <Input
                id="amazon_asin"
                value={game.amazon_asin || ''}
                onChange={(e) => updateField('amazon_asin', e.target.value.toUpperCase() || null)}
                placeholder="e.g., B09777HSJX"
                maxLength={10}
                className="font-mono"
              />
              {game.amazon_asin && (
                <a
                  href={`https://www.amazon.com/dp/${game.amazon_asin}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="icon" className="shrink-0">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </a>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              10-character product identifier for "Buy on Amazon" button
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline & History */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Workflow className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg uppercase">Pipeline & History</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">Processing state and record timestamps</CardDescription>
            </div>
            <Link href={`/admin/vecna?game=${game.id}`}>
              <Button variant="outline" size="sm" className="gap-1.5">
                <Play className="h-3.5 w-3.5" />
                Open in Vecna
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current State - Compact */}
          <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
            {isProcessing ? (
              <Loader2 className="h-4 w-4 animate-spin text-primary" />
            ) : vecnaState === 'published' ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : vecnaState === 'rulebook_missing' || vecnaState === 'review_pending' ? (
              <AlertCircle className="h-4 w-4 text-amber-500" />
            ) : (
              <div className="h-4 w-4 rounded-full bg-primary/20 flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" />
              </div>
            )}
            <div className="flex items-center gap-2 flex-1">
              <Badge className={getStateBadgeClass(vecnaState)}>
                {stateConfig?.label || vecnaState}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {stateConfig?.description || 'Processing state'}
              </span>
            </div>
          </div>

          {/* Error Display */}
          {game.vecna_error && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50">
              <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
              <p className="text-sm text-red-600 dark:text-red-400">{game.vecna_error}</p>
            </div>
          )}

          {/* All Timestamps Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
            <div className="p-2.5 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Created</p>
              <p className="font-medium text-sm mt-0.5">{formatDate(game.created_at)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Updated</p>
              <p className="font-medium text-sm mt-0.5">{formatDate(game.updated_at)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Processed</p>
              <p className="font-medium text-sm mt-0.5">{formatDate(game.vecna_processed_at)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Generated</p>
              <p className="font-medium text-sm mt-0.5">{formatDate(game.content_generated_at)}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-muted/50">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide">Reviewed</p>
              <p className="font-medium text-sm mt-0.5">{formatDate(game.content_reviewed_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
