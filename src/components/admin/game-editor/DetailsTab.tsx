'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
  Settings,
  Cog,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { getCrunchLabel, getCrunchBadgeClasses } from '@/lib/rulebook/complexity-utils'
import type { Game } from '@/types/database'

interface DetailsTabProps {
  game: Game
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
}

export function DetailsTab({ game, updateField }: DetailsTabProps) {
  return (
    <div className="space-y-6">
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
            <Textarea
              id="description"
              value={game.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={4}
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
            <div className="p-4 rounded-lg border bg-amber-500/5 border-amber-500/20">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Cog className="h-5 w-5 text-amber-500" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-bold">{Number(game.crunch_score).toFixed(1)}</span>
                    <Badge className={getCrunchBadgeClasses(Number(game.crunch_score))}>
                      {getCrunchLabel(Number(game.crunch_score))}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">Crunch Score (AI-generated from rulebook)</p>
                </div>
              </div>
            </div>
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

      {/* Content Status */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <Settings className="h-4 w-4 text-blue-500" />
            </div>
            <div>
              <CardTitle className="text-lg">Content Status</CardTitle>
              <CardDescription>Track the content pipeline stage</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Current Status</Label>
            <select
              value={game.content_status || 'none'}
              onChange={(e) => updateField('content_status', e.target.value)}
              className="w-full px-3 py-2 border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
            >
              <option value="none">None - No content yet</option>
              <option value="importing">Importing - Fetching from BGG</option>
              <option value="draft">Draft - AI content generated</option>
              <option value="review">Review - Ready for human review</option>
              <option value="published">Published - Content finalized</option>
            </select>
          </div>

          <div className="pt-4 border-t">
            <h4 className="text-sm font-medium mb-3">Timestamps</h4>
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
