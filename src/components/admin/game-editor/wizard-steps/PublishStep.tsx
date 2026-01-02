'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Rocket,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ImageIcon,
  FileText,
  BookOpen,
  Users,
  Clock,
  Star,
} from 'lucide-react'
import type { Game, GameImage } from '@/types/database'

interface PublishStepProps {
  game: Game
  images: GameImage[]
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
  onSave: () => Promise<void>
  saving: boolean
  saved: boolean
}

export function PublishStep({
  game,
  images,
  updateField,
  onSave,
  saving,
  saved,
}: PublishStepProps) {
  const hasRulebook = !!game.rulebook_url
  const hasCrunchScore = !!game.crunch_score
  const hasContent = !!(game.has_rules || game.has_setup_guide || game.has_reference)
  const hasImages = images.length > 0
  const hasPrimaryImage = images.some((img) => img.is_primary)

  const readyToPublish = hasImages && hasContent

  const handlePublish = async () => {
    updateField('is_published', true)
    updateField('content_status', 'published')
    await onSave()
  }

  return (
    <div className="space-y-6">
      {/* Main Publish Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
              <Rocket className="h-5 w-5 text-green-500" />
            </div>
            <div className="flex-1">
              <CardTitle>Ready to Publish?</CardTitle>
              <CardDescription>
                Review the game details and make it live on the site.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Readiness Checklist */}
          <div className="space-y-3">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Readiness Checklist
            </Label>
            <div className="grid gap-2">
              <ChecklistItem
                checked={hasRulebook}
                label="Rulebook URL"
                description={hasRulebook ? 'Rulebook linked' : 'No rulebook URL set'}
              />
              <ChecklistItem
                checked={hasCrunchScore}
                label="Crunch Score"
                description={hasCrunchScore ? `Score: ${game.crunch_score}/10` : 'Not generated yet'}
              />
              <ChecklistItem
                checked={hasContent}
                label="Content Generated"
                description={
                  hasContent
                    ? `${[game.has_rules && 'Rules', game.has_setup_guide && 'Setup', game.has_reference && 'Reference'].filter(Boolean).join(', ')}`
                    : 'No content yet'
                }
              />
              <ChecklistItem
                checked={hasImages}
                label="Images Uploaded"
                description={
                  hasImages
                    ? `${images.length} image${images.length !== 1 ? 's' : ''}${hasPrimaryImage ? ' (primary set)' : ''}`
                    : 'No images uploaded'
                }
              />
            </div>
          </div>

          {/* Warning if not ready */}
          {!readyToPublish && (
            <div className="flex items-start gap-3 p-4 rounded-lg bg-amber-50 text-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium">Missing required content</p>
                <p>Add images and generate content before publishing for the best user experience.</p>
              </div>
            </div>
          )}

          {/* Publish Toggle */}
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

          {/* Publish Button */}
          <Button
            onClick={handlePublish}
            disabled={saving || !!game.is_published}
            size="lg"
            className="w-full gap-2"
          >
            {saving ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-5 w-5" />
            ) : (
              <Rocket className="h-5 w-5" />
            )}
            {game.is_published
              ? 'Already Published'
              : saving
                ? 'Publishing...'
                : saved
                  ? 'Published!'
                  : 'Publish Game'}
          </Button>
        </CardContent>
      </Card>

      {/* Game Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Game Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <SummaryItem
              icon={<Users className="h-4 w-4" />}
              label="Players"
              value={
                game.player_count_min === game.player_count_max
                  ? `${game.player_count_min}`
                  : `${game.player_count_min}-${game.player_count_max}`
              }
            />
            <SummaryItem
              icon={<Clock className="h-4 w-4" />}
              label="Play Time"
              value={
                game.play_time_min === game.play_time_max
                  ? `${game.play_time_min} min`
                  : `${game.play_time_min}-${game.play_time_max} min`
              }
            />
            <SummaryItem
              icon={<Star className="h-4 w-4" />}
              label="Crunch"
              value={game.crunch_score ? `${game.crunch_score}/10` : game.weight ? `${game.weight}/5 BGG` : 'N/A'}
            />
            <SummaryItem
              icon={<BookOpen className="h-4 w-4" />}
              label="Year"
              value={game.year_published?.toString() || 'N/A'}
            />
          </div>

          {/* Tags preview */}
          {(game.is_trending || game.is_top_rated || game.is_staff_pick || game.is_hidden_gem || game.is_new_release) && (
            <div className="mt-4 pt-4 border-t">
              <Label className="text-xs text-muted-foreground uppercase tracking-wider">Collection Tags</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {game.is_trending && <Badge variant="secondary">Trending</Badge>}
                {game.is_top_rated && <Badge variant="secondary">Top Rated</Badge>}
                {game.is_staff_pick && <Badge variant="secondary">Staff Pick</Badge>}
                {game.is_hidden_gem && <Badge variant="secondary">Hidden Gem</Badge>}
                {game.is_new_release && <Badge variant="secondary">New Release</Badge>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function ChecklistItem({
  checked,
  label,
  description,
}: {
  checked: boolean
  label: string
  description: string
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/30">
      {checked ? (
        <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
      ) : (
        <div className="h-5 w-5 rounded-full border-2 border-muted-foreground/30 shrink-0" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{label}</p>
        <p className="text-xs text-muted-foreground truncate">{description}</p>
      </div>
    </div>
  )
}

function SummaryItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) {
  return (
    <div className="p-3 rounded-lg bg-muted/50 text-center">
      <div className="flex items-center justify-center gap-1.5 text-muted-foreground mb-1">
        {icon}
        <span className="text-xs uppercase tracking-wide">{label}</span>
      </div>
      <p className="font-semibold">{value}</p>
    </div>
  )
}
