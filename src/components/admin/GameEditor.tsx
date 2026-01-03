'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { SourcedImage } from '@/components/admin/TempImage'
import { GameRelationsEditor } from '@/components/admin/GameRelationsEditor'
import { DetailsTab, RulebookContentTab, GameSetupWizard } from './game-editor'
import { useAsyncAction } from '@/hooks/admin'
import {
  ArrowLeft,
  Save,
  Eye,
  Loader2,
  ExternalLink,
  CheckCircle2,
  Info,
  ImageIcon,
  BookOpen,
  Link2,
  Wand2,
} from 'lucide-react'
import type { Game, GameImage } from '@/types/database'

interface Publisher {
  id: string
  name: string
  slug: string
  website: string | null
}

type GameWithImages = Game & { images: GameImage[]; publishers_list?: Publisher[] }

interface GameEditorProps {
  game: GameWithImages
}

export function GameEditor({ game: initialGame }: GameEditorProps) {
  const router = useRouter()
  const [game, setGame] = useState(initialGame)
  const [images, setImages] = useState(initialGame.images)
  const { saving, saved, execute, markUnsaved } = useAsyncAction()

  // Sync state when server data changes (e.g., after router.refresh())
  useEffect(() => {
    setGame(initialGame)
    setImages(initialGame.images)
  }, [initialGame])

  // Editor mode: wizard vs advanced
  // - Unpublished games default to wizard mode
  // - Published games default to advanced mode
  // - User can toggle between modes
  const [editorMode, setEditorMode] = useState<'wizard' | 'advanced'>(
    initialGame.is_published ? 'advanced' : 'wizard'
  )
  const showWizard = editorMode === 'wizard'

  const updateField = useCallback(<K extends keyof Game>(field: K, value: Game[K]) => {
    setGame(prev => ({ ...prev, [field]: value }))
    markUnsaved()
  }, [markUnsaved])

  const saveGame = async () => {
    // Get primary image URL for hero_image_url
    const primaryImage = images.find(img => img.is_primary)

    // Ensure content_status is 'published' when publishing
    const contentStatus = game.is_published ? 'published' : (game.content_status || 'none')

    await execute(async () => {
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
            content_status: contentStatus,
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

      router.refresh()
    })
  }

  // Show wizard mode
  if (showWizard) {
    return (
      <GameSetupWizard
        game={{ ...game, images }}
        onExitToAdvanced={() => setEditorMode('advanced')}
      />
    )
  }

  // Advanced editor (tabs)
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
          <Button
            variant="outline"
            size="sm"
            onClick={() => setEditorMode('wizard')}
            className="gap-2"
          >
            <Wand2 className="h-4 w-4" />
            <span className="hidden sm:inline">Setup Wizard</span>
          </Button>
          <Link href={`/admin/games/${game.id}/preview`} target="_blank">
            <Button variant="outline" size="sm" className="gap-2">
              <Eye className="h-4 w-4" />
              <span className="hidden sm:inline">Preview</span>
            </Button>
          </Link>
          {game.is_published && (
            <Link href={`/games/${game.slug}`} target="_blank">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="h-4 w-4" />
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

      {/* Editor Tabs - Consolidated to 4 tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
          <TabsTrigger value="details" className="gap-2">
            <Info className="h-4 w-4 hidden sm:block" />
            Details
          </TabsTrigger>
          <TabsTrigger value="rulebook" className="gap-2">
            <BookOpen className="h-4 w-4 hidden sm:block" />
            Rulebook & Content
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <ImageIcon className="h-4 w-4 hidden sm:block" />
            Images
          </TabsTrigger>
          <TabsTrigger value="relations" className="gap-2">
            <Link2 className="h-4 w-4 hidden sm:block" />
            Relations
          </TabsTrigger>
        </TabsList>

        {/* Details Tab (includes Publishing) */}
        <TabsContent value="details">
          <DetailsTab game={game} updateField={updateField} />
        </TabsContent>

        {/* Rulebook & Content Tab */}
        <TabsContent value="rulebook">
          <RulebookContentTab
            game={game}
            updateField={updateField}
            onRulebookUrlChange={(url) => updateField('rulebook_url', url)}
          />
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
                  markUnsaved()
                }}
              />

              {/* Show Wikidata CC-licensed image if available */}
              {images.length === 0 && game.wikidata_image_url && (
                <Card className="border-dashed border-blue-500/50 bg-blue-500/5">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm text-blue-600 dark:text-blue-400">
                      Wikidata Image (CC Licensed)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      This CC-licensed image from Wikimedia Commons is safe for production use.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <SourcedImage
                      src={game.wikidata_image_url}
                      alt={`${game.name}`}
                      source="wikidata"
                      aspectRatio="4/3"
                      className="max-w-md rounded-lg overflow-hidden"
                    />
                  </CardContent>
                </Card>
              )}

              {/* Show BGG reference image when no Wikidata image and no images uploaded */}
              {images.length === 0 && !game.wikidata_image_url && (game.bgg_raw_data as { reference_images?: { box?: string } })?.reference_images?.box && (
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
                    <SourcedImage
                      src={(game.bgg_raw_data as { reference_images: { box: string } }).reference_images.box}
                      alt={`${game.name} reference`}
                      source="bgg"
                      aspectRatio="4/3"
                      className="max-w-md rounded-lg overflow-hidden"
                    />
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relations Tab */}
        <TabsContent value="relations" className="space-y-6">
          <GameRelationsEditor
            key={game.id}
            game={game}
            onFamilyChange={(familyId) => updateField('family_id', familyId)}
          />
        </TabsContent>
      </Tabs>
    </div>
  )
}
