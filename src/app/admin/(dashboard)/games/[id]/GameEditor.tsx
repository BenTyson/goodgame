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
import { TempImage } from '@/components/admin/TempImage'
import { GameRelationsEditor } from '@/components/admin/GameRelationsEditor'
import { RulebookEditor } from '@/components/admin/RulebookEditor'
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Info,
  ImageIcon,
  FileText,
  Settings,
  Users,
  Clock,
  Scale,
  Calendar,
  Building2,
  Pencil,
  Hash,
  Link2,
  BookOpen,
} from 'lucide-react'
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

    try {
      const response = await fetch('/api/admin/games', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          data: {
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
            is_trending: game.is_trending,
            is_top_rated: game.is_top_rated,
            is_staff_pick: game.is_staff_pick,
            is_hidden_gem: game.is_hidden_gem,
            is_new_release: game.is_new_release,
            content_status: game.content_status,
            rules_content: game.rules_content,
            setup_content: game.setup_content,
            reference_content: game.reference_content,
            hero_image_url: primaryImage?.url || game.hero_image_url,
            box_image_url: primaryImage?.url || game.box_image_url,
            thumbnail_url: primaryImage?.url || game.thumbnail_url,
          }
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Save failed')
      }

      setSaved(true)
      router.refresh()
    } catch (error) {
      console.error('Save error:', error)
      alert('Failed to save: ' + (error instanceof Error ? error.message : 'Unknown error'))
    } finally {
      setSaving(false)
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
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Link href="/admin/games" className="self-start">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Games
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{game.name}</h1>
            {game.is_published && (
              <span className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-green-600 text-white">
                <CheckCircle2 className="h-3 w-3" />
                Published
              </span>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">/{game.slug}</p>
        </div>
        <div className="flex items-center gap-2 self-start sm:self-center">
          {game.is_published && (
            <Link href={`/games/${game.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">View Live</span>
              </Button>
            </Link>
          )}
          <Button
            onClick={saveGame}
            disabled={saving}
            className={saved ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {saving ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : saved ? (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            ) : (
              <Save className="h-4 w-4 mr-2" />
            )}
            {saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {/* Editor Tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="details" className="gap-2">
            <Info className="h-4 w-4 hidden sm:block" />
            Details
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <ImageIcon className="h-4 w-4 hidden sm:block" />
            Images
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4 hidden sm:block" />
            Content
          </TabsTrigger>
          <TabsTrigger value="rulebook" className="gap-2">
            <BookOpen className="h-4 w-4 hidden sm:block" />
            Rulebook
          </TabsTrigger>
          <TabsTrigger value="relationships" className="gap-2">
            <Link2 className="h-4 w-4 hidden sm:block" />
            Relations
          </TabsTrigger>
          <TabsTrigger value="publishing" className="gap-2">
            <Settings className="h-4 w-4 hidden sm:block" />
            Publishing
          </TabsTrigger>
        </TabsList>

        {/* Details Tab */}
        <TabsContent value="details" className="space-y-6">
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
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Game Images</CardTitle>
                  <CardDescription>
                    Upload cover art and gallery images. The primary image appears on cards and as the hero.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <ImageUpload
                gameId={game.id}
                gameSlug={game.slug}
                images={images}
                onImagesChange={(newImages) => {
                  setImages(newImages)
                  setSaved(false)
                }}
              />

              {/* Show BGG reference image when no images uploaded */}
              {images.length === 0 && (game.bgg_raw_data as { reference_images?: { box?: string } })?.reference_images?.box && (
                <Card className="border-dashed border-amber-500/50 bg-amber-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-amber-600 dark:text-amber-400">
                      BGG Reference Image
                    </CardTitle>
                    <CardDescription className="text-xs">
                      This image is from BoardGameGeek for reference only. Upload your own licensed images above.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <TempImage
                      src={(game.bgg_raw_data as { reference_images: { box: string } }).reference_images.box}
                      alt={`${game.name} reference`}
                      aspectRatio="4/3"
                      className="max-w-md rounded-lg overflow-hidden"
                    />
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-orange-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Rules Content</CardTitle>
                  <CardDescription>Quick start guide and rules overview for players</CardDescription>
                </div>
              </div>
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
                  placeholder="A brief overview of the game and what makes it fun..."
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Start Steps</Label>
                <Textarea
                  value={rulesContent.quickStart?.join('\n') || ''}
                  onChange={(e) => updateField('rules_content', {
                    ...rulesContent,
                    quickStart: e.target.value.split('\n').filter(Boolean)
                  })}
                  rows={4}
                  placeholder="Step 1: Set up the board&#10;Step 2: Deal starting cards&#10;Step 3: Choose first player"
                />
                <p className="text-xs text-muted-foreground">One step per line</p>
              </div>

              <div className="space-y-2">
                <Label>Strategy Tips</Label>
                <Textarea
                  value={rulesContent.tips?.join('\n') || ''}
                  onChange={(e) => updateField('rules_content', {
                    ...rulesContent,
                    tips: e.target.value.split('\n').filter(Boolean)
                  })}
                  rows={4}
                  placeholder="Focus on resource management early&#10;Don't neglect defense"
                />
                <p className="text-xs text-muted-foreground">One tip per line</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Settings className="h-4 w-4 text-cyan-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Setup Content</CardTitle>
                  <CardDescription>Setup instructions and component checklist</CardDescription>
                </div>
              </div>
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
                  placeholder="e.g., The player who most recently traveled goes first"
                />
              </div>

              <div className="space-y-2">
                <Label>Setup Tips</Label>
                <Textarea
                  value={setupContent.quickTips?.join('\n') || ''}
                  onChange={(e) => updateField('setup_content', {
                    ...setupContent,
                    quickTips: e.target.value.split('\n').filter(Boolean)
                  })}
                  rows={4}
                  placeholder="Tip 1&#10;Tip 2&#10;Tip 3"
                />
                <p className="text-xs text-muted-foreground">One tip per line</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-pink-500/10 flex items-center justify-center">
                  <FileText className="h-4 w-4 text-pink-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">Reference Content</CardTitle>
                  <CardDescription>Quick reference card and end game conditions</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>End Game Condition</Label>
                <Textarea
                  value={referenceContent.endGame}
                  onChange={(e) => updateField('reference_content', {
                    ...referenceContent,
                    endGame: e.target.value
                  })}
                  rows={2}
                  placeholder="The game ends when a player reaches 10 victory points..."
                />
              </div>

              <div className="space-y-2">
                <Label>Quick Reminders</Label>
                <Textarea
                  value={referenceContent.quickReminders?.join('\n') || ''}
                  onChange={(e) => updateField('reference_content', {
                    ...referenceContent,
                    quickReminders: e.target.value.split('\n').filter(Boolean)
                  })}
                  rows={4}
                  placeholder="Draw a card at the end of your turn&#10;You can only build on your turn"
                />
                <p className="text-xs text-muted-foreground">One reminder per line</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rulebook Tab */}
        <TabsContent value="rulebook" className="space-y-6">
          <RulebookEditor
            game={game}
            onRulebookUrlChange={(url) => updateField('rulebook_url', url)}
          />
        </TabsContent>

        {/* Relationships Tab */}
        <TabsContent value="relationships" className="space-y-6">
          <GameRelationsEditor
            game={game}
            onFamilyChange={(familyId) => updateField('family_id', familyId)}
          />
        </TabsContent>

        {/* Publishing Tab */}
        <TabsContent value="publishing" className="space-y-6">
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
        </TabsContent>
      </Tabs>
    </div>
  )
}
