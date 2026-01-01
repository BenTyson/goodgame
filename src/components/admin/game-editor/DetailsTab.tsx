'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import {
  ExternalLink,
  Users,
  Clock,
  Scale,
  Calendar,
  Building2,
  Pencil,
  Hash,
} from 'lucide-react'
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
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="weight" className="flex items-center gap-1.5">
                <Scale className="h-3.5 w-3.5 text-muted-foreground" />
                Weight
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
              <p className="text-xs text-muted-foreground">1 = Light, 5 = Heavy</p>
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
    </div>
  )
}
