'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { CheckCircle2, Hash, Settings } from 'lucide-react'
import type { Game } from '@/types/database'

interface PublishingTabProps {
  game: Game
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
}

export function PublishingTab({ game, updateField }: PublishingTabProps) {
  return (
    <div className="space-y-6">
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
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-base">Trending Now</Label>
              <p className="text-sm text-muted-foreground">
                Currently popular and generating buzz
              </p>
            </div>
            <Switch
              checked={game.is_trending || false}
              onCheckedChange={(checked) => updateField('is_trending', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-base">Top Rated</Label>
              <p className="text-sm text-muted-foreground">
                Highest rated games in our collection
              </p>
            </div>
            <Switch
              checked={game.is_top_rated || false}
              onCheckedChange={(checked) => updateField('is_top_rated', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-base">Staff Pick</Label>
              <p className="text-sm text-muted-foreground">
                Personally recommended by our team
              </p>
            </div>
            <Switch
              checked={game.is_staff_pick || false}
              onCheckedChange={(checked) => updateField('is_staff_pick', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-base">Hidden Gem</Label>
              <p className="text-sm text-muted-foreground">
                Underrated games worth discovering
              </p>
            </div>
            <Switch
              checked={game.is_hidden_gem || false}
              onCheckedChange={(checked) => updateField('is_hidden_gem', checked)}
            />
          </div>

          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
            <div className="space-y-0.5">
              <Label className="text-base">New Release</Label>
              <p className="text-sm text-muted-foreground">
                Recently released games
              </p>
            </div>
            <Switch
              checked={game.is_new_release || false}
              onCheckedChange={(checked) => updateField('is_new_release', checked)}
            />
          </div>
        </CardContent>
      </Card>

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
