'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { AutoResizeTextarea } from '@/components/ui/auto-resize-textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  ExternalLink,
  Users,
  Clock,
  Scale,
  Calendar,
  Building2,
  Pencil,
  Hash,
  CheckCircle2,
  Workflow,
  AlertCircle,
  Loader2,
  Play,
  ArrowRight,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { CrunchScoreDisplay } from '@/components/admin/rulebook'
import type { CrunchBreakdown } from '@/lib/rulebook/types'
import { VECNA_STATE_CONFIG, type VecnaState } from '@/lib/vecna/types'
import type { Game } from '@/types/database'

interface DetailsTabProps {
  game: Game
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
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

// Helper to format date
function formatDate(dateStr: string | null): string {
  if (!dateStr) return 'Never'
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function DetailsTab({ game, updateField }: DetailsTabProps) {
  const vecnaState = (game.vecna_state as VecnaState) || 'imported'
  const stateConfig = VECNA_STATE_CONFIG[vecnaState]
  const isProcessing = vecnaState === 'parsing' || vecnaState === 'generating'

  return (
    <div className="space-y-6">
      {/* Pipeline Status */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Workflow className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Vecna Pipeline Status</CardTitle>
              <CardDescription>Content processing state and history</CardDescription>
            </div>
            <Link href={`/admin/vecna?game=${game.id}`}>
              <Button variant="outline" size="sm" className="gap-2">
                <Play className="h-4 w-4" />
                Open in Vecna
                <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Current State */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="flex items-center gap-3">
              {isProcessing ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : vecnaState === 'published' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : vecnaState === 'rulebook_missing' || vecnaState === 'review_pending' ? (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
              )}
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-medium">Current State:</span>
                  <Badge className={getStateBadgeClass(vecnaState)}>
                    {stateConfig?.label || vecnaState}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {stateConfig?.description || 'Processing state'}
                </p>
              </div>
            </div>
          </div>

          {/* Error Display */}
          {game.vecna_error && (
            <div className="flex items-start gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900/50">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <span className="font-medium text-red-700 dark:text-red-400 text-sm">Processing Error</span>
                <p className="text-sm text-red-600 dark:text-red-400 mt-0.5">{game.vecna_error}</p>
              </div>
            </div>
          )}

          {/* Timestamps */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Processed</p>
              <p className="font-medium mt-1 text-sm">
                {formatDate(game.vecna_processed_at)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Content Generated</p>
              <p className="font-medium mt-1 text-sm">
                {formatDate(game.content_generated_at)}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Content Reviewed</p>
              <p className="font-medium mt-1 text-sm">
                {formatDate(game.content_reviewed_at)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Identity */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Pencil className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Identity</CardTitle>
              <CardDescription>Name, slug, and description</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Game Name</Label>
              <Input
                id="name"
                value={game.name}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="e.g., Catan"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug</Label>
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
            <Label htmlFor="tagline">Tagline</Label>
            <Input
              id="tagline"
              value={game.tagline || ''}
              onChange={(e) => updateField('tagline', e.target.value)}
              placeholder="A short catchy description that appears on cards"
            />
            <p className="text-xs text-muted-foreground">Keep it under 100 characters</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <AutoResizeTextarea
              id="description"
              value={game.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              minRows={4}
              maxRows={30}
              placeholder="Detailed description of the game..."
            />
          </div>
        </CardContent>
      </Card>

      {/* Player & Time */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Users className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Players & Time</CardTitle>
              <CardDescription>Player count and play time ranges</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="player_min" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Min Players
              </Label>
              <Input
                id="player_min"
                type="number"
                min="1"
                value={game.player_count_min}
                onChange={(e) => updateField('player_count_min', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="player_max" className="flex items-center gap-1.5">
                <Users className="h-3.5 w-3.5 text-muted-foreground" />
                Max Players
              </Label>
              <Input
                id="player_max"
                type="number"
                min="1"
                value={game.player_count_max}
                onChange={(e) => updateField('player_count_max', parseInt(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="time_min" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Min Time
              </Label>
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
              <Label htmlFor="time_max" className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                Max Time
              </Label>
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
        </CardContent>
      </Card>

      {/* Metadata */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Hash className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Metadata</CardTitle>
              <CardDescription>Complexity, age, year, and external links</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Crunch Score Display (read-only, AI-generated) */}
          {game.crunch_score != null && (
            <CrunchScoreDisplay
              score={Number(game.crunch_score)}
              breakdown={game.crunch_breakdown as CrunchBreakdown | null}
              generatedAt={game.crunch_generated_at}
              bggReference={game.crunch_bgg_reference ? Number(game.crunch_bgg_reference) : undefined}
            />
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                BGG Weight
              </Label>
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
              <p className="text-xs text-muted-foreground">BGG scale: 1 = Light, 5 = Heavy</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="min_age">Min Age</Label>
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
              <Label htmlFor="year" className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                Year
              </Label>
              <Input
                id="year"
                type="number"
                value={game.year_published || ''}
                onChange={(e) => updateField('year_published', parseInt(e.target.value) || null)}
                placeholder="2024"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bgg_id">BGG ID</Label>
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

          <div className="grid sm:grid-cols-2 gap-4 pt-2">
            <div className="space-y-2">
              <Label htmlFor="publisher" className="flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                Publisher
              </Label>
              <Input
                id="publisher"
                value={game.publisher || ''}
                onChange={(e) => updateField('publisher', e.target.value)}
                placeholder="e.g., Catan Studio"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="designers">Designers</Label>
              <Input
                id="designers"
                value={game.designers?.join(', ') || ''}
                onChange={(e) => updateField('designers', e.target.value.split(',').map(d => d.trim()).filter(Boolean))}
                placeholder="Comma-separated names"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Visibility Settings */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Visibility Settings</CardTitle>
              <CardDescription>Control where this game appears on the site</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-base">Published</Label>
              <p className="text-sm text-muted-foreground">
                Make this game visible on the public site
              </p>
            </div>
            <Switch
              checked={game.is_published || false}
              onCheckedChange={(checked) => updateField('is_published', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-base">Featured</Label>
              <p className="text-sm text-muted-foreground">
                Show on homepage and featured sections
              </p>
            </div>
            <Switch
              checked={game.is_featured || false}
              onCheckedChange={(checked) => updateField('is_featured', checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Collection Tags */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
              <Hash className="h-4 w-4 text-purple-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Collection Tags</CardTitle>
              <CardDescription>Tag games for homepage collections and discovery</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Trending Now</Label>
                <p className="text-xs text-muted-foreground">Currently popular</p>
              </div>
              <Switch
                checked={game.is_trending || false}
                onCheckedChange={(checked) => updateField('is_trending', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Top Rated</Label>
                <p className="text-xs text-muted-foreground">Highest rated games</p>
              </div>
              <Switch
                checked={game.is_top_rated || false}
                onCheckedChange={(checked) => updateField('is_top_rated', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Staff Pick</Label>
                <p className="text-xs text-muted-foreground">Team recommendation</p>
              </div>
              <Switch
                checked={game.is_staff_pick || false}
                onCheckedChange={(checked) => updateField('is_staff_pick', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">Hidden Gem</Label>
                <p className="text-xs text-muted-foreground">Underrated games</p>
              </div>
              <Switch
                checked={game.is_hidden_gem || false}
                onCheckedChange={(checked) => updateField('is_hidden_gem', checked)}
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
              <div className="space-y-0.5">
                <Label className="text-base">New Release</Label>
                <p className="text-xs text-muted-foreground">Recently released</p>
              </div>
              <Switch
                checked={game.is_new_release || false}
                onCheckedChange={(checked) => updateField('is_new_release', checked)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Record Timestamps */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-slate-500/10 flex items-center justify-center">
              <Clock className="h-4 w-4 text-slate-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Record History</CardTitle>
              <CardDescription>When this game was created and last modified</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Created</p>
              <p className="font-medium mt-1">
                {game.created_at ? new Date(game.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
            <div className="p-3 rounded-lg bg-muted/50">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Last Updated</p>
              <p className="font-medium mt-1">
                {game.updated_at ? new Date(game.updated_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                }) : 'N/A'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
