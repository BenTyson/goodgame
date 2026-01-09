'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Loader2, Plus, Check } from 'lucide-react'
import type { Game, GameImage } from '@/types/database'

type SourceImage = {
  url: string
  source: 'wikipedia' | 'wikidata' | 'bgg'
  license?: string
  canImport: boolean
}

interface AvailableImageSourcesProps {
  game: Game
  images: GameImage[]
  importingImages: Set<string>
  importedImages: Set<string>
  onImportImage: (url: string, source: 'wikipedia' | 'wikidata', license?: string, makePrimary?: boolean) => void
}

const SOURCE_COLORS = {
  wikipedia: { bg: 'bg-purple-500', text: 'text-purple-400', label: 'Wikipedia' },
  wikidata: { bg: 'bg-blue-500', text: 'text-blue-400', label: 'Wikidata' },
  bgg: { bg: 'bg-red-500', text: 'text-red-400', label: 'BGG' },
}

export function AvailableImageSources({
  game,
  images,
  importingImages,
  importedImages,
  onImportImage,
}: AvailableImageSourcesProps) {
  const wikipediaImages = game.wikipedia_images as {
    filename: string
    url?: string
    thumbUrl?: string
    caption?: string
    license?: string
    isPrimary?: boolean
  }[] | null
  const wikidataImage = game.wikidata_image_url
  const bggImage = (game.bgg_raw_data as { image?: string | null })?.image

  const hasAnySources = (wikipediaImages && wikipediaImages.length > 0) || wikidataImage || bggImage
  if (!hasAnySources) return null

  const isFairUse = (license?: string) =>
    !license || license.toLowerCase().includes('fair use') || license.toLowerCase().includes('non-free')

  const getImageUrl = (img: { url?: string; thumbUrl?: string }) => img.thumbUrl || img.url || ''

  const isImageInGallery = (url: string) => {
    return images.some(img => img.url === url)
  }

  // Collect all source images into a unified list
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
            const colors = SOURCE_COLORS[img.source]

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
                        onClick={() => onImportImage(
                          img.url,
                          img.source as 'wikipedia' | 'wikidata',
                          img.license,
                          images.length === 0
                        )}
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
}
