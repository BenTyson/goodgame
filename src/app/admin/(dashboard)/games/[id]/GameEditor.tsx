'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { ArrowLeft, Save, Eye, Loader2, ExternalLink } from 'lucide-react'
import type { Database } from '@/types/supabase'
import type { Game, GameImage, RulesContent, SetupContent, ReferenceContent } from '@/types/database'

type GameWithImages = Game & { images: GameImage[] }

interface GameEditorProps {
  game: GameWithImages
}

export function GameEditor({ game: initialGame }: GameEditorProps) {
  const router = useRouter()
  const [game, setGame] = useState(initialGame)
  const [images, setImages] = useState(initialGame.images)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const updateField = <K extends keyof Game>(field: K, value: Game[K]) => {
    setGame(prev => ({ ...prev, [field]: value }))
    setSaved(false)
  }

  const saveGame = async () => {
    setSaving(true)

    // Get primary image URL for hero_image_url
    const primaryImage = images.find(img => img.is_primary)

    const { error } = await supabase
      .from('games')
      .update({
        name: game.name,
        slug: game.slug,
        description: game.description,
        tagline: game.tagline,
        player_count_min: game.player_count_min,
        player_count_max: game.player_count_max,
        play_time_min: game.play_time_min,
        play_time_max: game.play_time_max,
        weight: game.weight,
        min_age: game.min_age,
        year_published: game.year_published,
        publisher: game.publisher,
        designers: game.designers,
        is_published: game.is_published,
        is_featured: game.is_featured,
        content_status: game.content_status,
        rules_content: game.rules_content,
        setup_content: game.setup_content,
        reference_content: game.reference_content,
        hero_image_url: primaryImage?.url || game.hero_image_url,
        box_image_url: primaryImage?.url || game.box_image_url,
        thumbnail_url: primaryImage?.url || game.thumbnail_url,
        updated_at: new Date().toISOString()
      })
      .eq('id', game.id)

    setSaving(false)

    if (error) {
      console.error('Save error:', error)
      alert('Failed to save: ' + error.message)
    } else {
      setSaved(true)
      router.refresh()
    }
  }

  // Parse JSONB content with fallbacks
  const rulesContent = (game.rules_content as unknown as RulesContent) || {
    quickStart: [],
    overview: '',
    setup: [],
    turnStructure: [],
    scoring: [],
    tips: []
  }

  const setupContent = (game.setup_content as unknown as SetupContent) || {
    playerSetup: [],
    boardSetup: [],
    componentChecklist: [],
    firstPlayerRule: '',
    quickTips: []
  }

  const referenceContent = (game.reference_content as unknown as ReferenceContent) || {
    turnSummary: [],
    keyRules: [],
    costs: [],
    quickReminders: [],
    endGame: ''
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/games">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold">{game.name}</h1>
            <p className="text-muted-foreground">{game.slug}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {game.is_published && (
            <Link href={`/games/${game.slug}`} target="_blank">
              <Button variant="outline" size="sm">
                <Eye className="h-4 w-4 mr-2" />
                View Live
              </Button>
            </Link>
          )}
          <Button onClick={saveGame} disabled={saving}>
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs defaultValue="details" className="space-y-4">
        <TabsList>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="images">Images</TabsTrigger>
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Core game details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={game.name}
                    onChange={(e) => updateField('name', e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input
                    id="slug"
                    value={game.slug}
                    onChange={(e) => updateField('slug', e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tagline">Tagline</Label>
                <Input
                  id="tagline"
                  value={game.tagline || ''}
                  onChange={(e) => updateField('tagline', e.target.value)}
                  placeholder="A short catchy description"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={game.description || ''}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="player_min">Min Players</Label>
                  <Input
                    id="player_min"
                    type="number"
                    value={game.player_count_min}
                    onChange={(e) => updateField('player_count_min', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="player_max">Max Players</Label>
                  <Input
                    id="player_max"
                    type="number"
                    value={game.player_count_max}
                    onChange={(e) => updateField('player_count_max', parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time_min">Min Time (min)</Label>
                  <Input
                    id="time_min"
                    type="number"
                    value={game.play_time_min || ''}
                    onChange={(e) => updateField('play_time_min', parseInt(e.target.value) || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time_max">Max Time (min)</Label>
                  <Input
                    id="time_max"
                    type="number"
                    value={game.play_time_max || ''}
                    onChange={(e) => updateField('play_time_max', parseInt(e.target.value) || null)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="weight">Weight (1-5)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    min="1"
                    max="5"
                    value={game.weight || ''}
                    onChange={(e) => updateField('weight', parseFloat(e.target.value) || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_age">Min Age</Label>
                  <Input
                    id="min_age"
                    type="number"
                    value={game.min_age || ''}
                    onChange={(e) => updateField('min_age', parseInt(e.target.value) || null)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="year">Year Published</Label>
                  <Input
                    id="year"
                    type="number"
                    value={game.year_published || ''}
                    onChange={(e) => updateField('year_published', parseInt(e.target.value) || null)}
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
                        <Button variant="outline" size="icon">
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      </a>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="publisher">Publisher</Label>
                <Input
                  id="publisher"
                  value={game.publisher || ''}
                  onChange={(e) => updateField('publisher', e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="designers">Designers (comma-separated)</Label>
                <Input
                  id="designers"
                  value={game.designers?.join(', ') || ''}
                  onChange={(e) => updateField('designers', e.target.value.split(',').map(d => d.trim()).filter(Boolean))}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Game Images</CardTitle>
              <CardDescription>
                Upload and manage images. The primary image is used on cards and as the hero.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImageUpload
                gameId={game.id}
                gameSlug={game.slug}
                images={images}
                onImagesChange={(newImages) => {
                  setImages(newImages)
                  setSaved(false)
                }}
              />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Rules Content</CardTitle>
              <CardDescription>Quick start guide and rules overview</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Overview</Label>
                <Textarea
                  value={rulesContent.overview}
                  onChange={(e) => updateField('rules_content', {
                    ...rulesContent,
                    overview: e.target.value
                  })}
                  rows={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Start (one per line)</Label>
                <Textarea
                  value={rulesContent.quickStart?.join('\n') || ''}
                  onChange={(e) => updateField('rules_content', {
                    ...rulesContent,
                    quickStart: e.target.value.split('\n').filter(Boolean)
                  })}
                  rows={4}
                  placeholder="Step 1&#10;Step 2&#10;Step 3"
                />
              </div>

              <div className="space-y-2">
                <Label>Tips (one per line)</Label>
                <Textarea
                  value={rulesContent.tips?.join('\n') || ''}
                  onChange={(e) => updateField('rules_content', {
                    ...rulesContent,
                    tips: e.target.value.split('\n').filter(Boolean)
                  })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Setup Content</CardTitle>
              <CardDescription>Setup instructions and component list</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>First Player Rule</Label>
                <Input
                  value={setupContent.firstPlayerRule}
                  onChange={(e) => updateField('setup_content', {
                    ...setupContent,
                    firstPlayerRule: e.target.value
                  })}
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Tips (one per line)</Label>
                <Textarea
                  value={setupContent.quickTips?.join('\n') || ''}
                  onChange={(e) => updateField('setup_content', {
                    ...setupContent,
                    quickTips: e.target.value.split('\n').filter(Boolean)
                  })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Reference Content</CardTitle>
              <CardDescription>Quick reference and end game conditions</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>End Game</Label>
                <Textarea
                  value={referenceContent.endGame}
                  onChange={(e) => updateField('reference_content', {
                    ...referenceContent,
                    endGame: e.target.value
                  })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Reminders (one per line)</Label>
                <Textarea
                  value={referenceContent.quickReminders?.join('\n') || ''}
                  onChange={(e) => updateField('reference_content', {
                    ...referenceContent,
                    quickReminders: e.target.value.split('\n').filter(Boolean)
                  })}
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Publishing Tab */}
        <TabsContent value="publishing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Publishing Settings</CardTitle>
              <CardDescription>Control visibility and status</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Published</Label>
                  <p className="text-sm text-muted-foreground">
                    Make this game visible on the public site
                  </p>
                </div>
                <Switch
                  checked={game.is_published || false}
                  onCheckedChange={(checked) => updateField('is_published', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Featured</Label>
                  <p className="text-sm text-muted-foreground">
                    Show on homepage and featured sections
                  </p>
                </div>
                <Switch
                  checked={game.is_featured || false}
                  onCheckedChange={(checked) => updateField('is_featured', checked)}
                />
              </div>

              <div className="space-y-2">
                <Label>Content Status</Label>
                <select
                  value={game.content_status || 'none'}
                  onChange={(e) => updateField('content_status', e.target.value)}
                  className="w-full px-3 py-2 border rounded-md bg-background"
                >
                  <option value="none">None</option>
                  <option value="importing">Importing</option>
                  <option value="draft">Draft</option>
                  <option value="review">Review</option>
                  <option value="published">Published</option>
                </select>
              </div>

              <div className="pt-4 border-t">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>{' '}
                    {game.created_at ? new Date(game.created_at).toLocaleDateString() : 'N/A'}
                  </div>
                  <div>
                    <span className="text-muted-foreground">Updated:</span>{' '}
                    {game.updated_at ? new Date(game.updated_at).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
