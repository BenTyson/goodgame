'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { DetailsTab, RulebookTab, ContentTab, TaxonomyTab, SourcesTab } from './game-editor'
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
  FileText,
  Tags,
  Database,
  Plus,
  Check,
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

  const updateField = useCallback(<K extends keyof Game>(field: K, value: Game[K]) => {
    setGame(prev => ({ ...prev, [field]: value }))
    markUnsaved()
  }, [markUnsaved])

  // State for tracking image import
  const [importingImages, setImportingImages] = useState<Set<string>>(new Set())
  const [importedImages, setImportedImages] = useState<Set<string>>(new Set())

  // Import external image to gallery
  const importExternalImage = async (
    url: string,
    source: 'wikipedia' | 'wikidata',
    license?: string,
    makePrimary: boolean = false
  ) => {
    const imageKey = `${source}:${url}`
    if (importingImages.has(imageKey) || importedImages.has(imageKey)) return

    setImportingImages(prev => new Set(prev).add(imageKey))

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          url,
          source,
          license,
          isPrimary: makePrimary,
          imageType: 'cover',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Import failed')
      }

      const { image } = await response.json()
      setImages(prev => [...prev, image])
      setImportedImages(prev => new Set(prev).add(imageKey))
      markUnsaved()
    } catch (error) {
      console.error('Failed to import image:', error)
    } finally {
      setImportingImages(prev => {
        const next = new Set(prev)
        next.delete(imageKey)
        return next
      })
    }
  }

  // Check if an external image URL is already in the gallery
  const isImageInGallery = useCallback((url: string) => {
    return images.some(img => img.url === url)
  }, [images])

  const saveGame = async () => {
    // Ensure content_status is 'published' when publishing
    const contentStatus = game.is_published ? 'published' : (game.content_status || 'none')

    // Note: Image URLs (hero_image_url, box_image_url, thumbnail_url) are synced
    // automatically by the /api/admin/upload PATCH endpoint when setting primary image.
    // No need to include them here.

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

      {/* Editor Tabs - 6 tabs */}
      <Tabs defaultValue="details" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 sm:grid-cols-6 lg:w-auto lg:inline-grid">
          <TabsTrigger value="details" className="gap-2">
            <Info className="h-4 w-4 hidden sm:block" />
            Details
          </TabsTrigger>
          <TabsTrigger value="taxonomy" className="gap-2">
            <Tags className="h-4 w-4 hidden sm:block" />
            Taxonomy
          </TabsTrigger>
          <TabsTrigger value="rulebook" className="gap-2">
            <BookOpen className="h-4 w-4 hidden sm:block" />
            Rulebook
          </TabsTrigger>
          <TabsTrigger value="content" className="gap-2">
            <FileText className="h-4 w-4 hidden sm:block" />
            Content
          </TabsTrigger>
          <TabsTrigger value="sources" className="gap-2">
            <Database className="h-4 w-4 hidden sm:block" />
            Sources
          </TabsTrigger>
          <TabsTrigger value="images" className="gap-2">
            <ImageIcon className="h-4 w-4 hidden sm:block" />
            Images
          </TabsTrigger>
        </TabsList>

        {/* Details Tab (includes Publishing) */}
        <TabsContent value="details">
          <DetailsTab game={game} updateField={updateField} />
        </TabsContent>

        {/* Taxonomy Tab */}
        <TabsContent value="taxonomy">
          <TaxonomyTab game={game} />
        </TabsContent>

        {/* Rulebook Tab */}
        <TabsContent value="rulebook">
          <RulebookTab
            game={game}
            onRulebookUrlChange={(url) => updateField('rulebook_url', url)}
          />
        </TabsContent>

        {/* Content Tab */}
        <TabsContent value="content">
          <ContentTab game={game} updateField={updateField} />
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources">
          <SourcesTab game={game} />
        </TabsContent>

        {/* Images Tab */}
        <TabsContent value="images" className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <ImageIcon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg uppercase">Game Images</CardTitle>
                  <CardDescription className="uppercase tracking-wider text-xs">
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

              {/* Available Image Sources */}
              {(() => {
                const wikipediaImages = game.wikipedia_images as { filename: string; url?: string; thumbUrl?: string; caption?: string; license?: string; isPrimary?: boolean }[] | null
                const wikidataImage = game.wikidata_image_url
                const bggImage = (game.bgg_raw_data as { image?: string | null })?.image

                const hasAnySources = (wikipediaImages && wikipediaImages.length > 0) || wikidataImage || bggImage
                if (!hasAnySources) return null

                const isFairUse = (license?: string) => !license || license.toLowerCase().includes('fair use') || license.toLowerCase().includes('non-free')
                const getImageUrl = (img: { url?: string; thumbUrl?: string }) => img.thumbUrl || img.url || ''

                // Collect all source images into a unified list
                type SourceImage = {
                  url: string
                  source: 'wikipedia' | 'wikidata' | 'bgg'
                  license?: string
                  canImport: boolean
                }

                const sourceImages: SourceImage[] = []

                // Add Wikipedia images
                if (wikipediaImages) {
                  wikipediaImages.forEach(img => {
                    const url = getImageUrl(img)
                    if (url) {
                      sourceImages.push({
                        url,
                        source: 'wikipedia',
                        license: img.license || 'Fair use',
                        canImport: true,
                      })
                    }
                  })
                }

                // Add Wikidata image
                if (wikidataImage) {
                  sourceImages.push({
                    url: wikidataImage,
                    source: 'wikidata',
                    license: 'CC Licensed',
                    canImport: true,
                  })
                }

                // Add BGG image (reference only)
                if (bggImage) {
                  sourceImages.push({
                    url: bggImage,
                    source: 'bgg',
                    license: 'Reference only',
                    canImport: false,
                  })
                }

                const sourceColors = {
                  wikipedia: { bg: 'bg-purple-500', text: 'text-purple-400', label: 'Wikipedia' },
                  wikidata: { bg: 'bg-blue-500', text: 'text-blue-400', label: 'Wikidata' },
                  bgg: { bg: 'bg-red-500', text: 'text-red-400', label: 'BGG' },
                }

                return (
                  <Card className="border-dashed">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">Available Image Sources</CardTitle>
                      <CardDescription className="text-xs">
                        Images fetched from external sources. Add to gallery to use on the game page.
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                        {sourceImages.map((img, i) => {
                          const imageKey = `${img.source}:${img.url}`
                          const isImporting = importingImages.has(imageKey)
                          const isImported = importedImages.has(imageKey) || isImageInGallery(img.url)
                          const colors = sourceColors[img.source]

                          return (
                            <div key={i} className="relative group">
                              <div className="aspect-[4/3] rounded-lg overflow-hidden border bg-muted">
                                <img
                                  src={img.url}
                                  alt={`${game.name} from ${colors.label}`}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                              {/* Source badge */}
                              <span className={`absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded ${colors.bg} text-white`}>
                                {colors.label}
                              </span>
                              {/* License badge */}
                              <span className={`absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded ${
                                img.source === 'bgg' ? 'bg-red-500/90' :
                                isFairUse(img.license) ? 'bg-amber-500/90' : 'bg-green-500/90'
                              } text-white`}>
                                {img.license}
                              </span>
                              {/* Hover overlay */}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                {img.canImport ? (
                                  isImported ? (
                                    <span className="flex items-center gap-1 text-xs text-white bg-green-600 px-2 py-1 rounded">
                                      <Check className="h-3 w-3" />
                                      In Gallery
                                    </span>
                                  ) : (
                                    <Button
                                      size="sm"
                                      variant="secondary"
                                      onClick={() => importExternalImage(img.url, img.source as 'wikipedia' | 'wikidata', img.license, images.length === 0)}
                                      disabled={isImporting}
                                      className="text-xs"
                                    >
                                      {isImporting ? (
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                      ) : (
                                        <Plus className="h-3 w-3 mr-1" />
                                      )}
                                      Add to Gallery
                                    </Button>
                                  )
                                ) : (
                                  <span className="text-xs text-white/80 text-center px-2">
                                    Reference only
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                )
              })()}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
