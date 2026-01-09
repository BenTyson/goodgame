'use client'

import { useState, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { VideoManager, type GameVideo } from '@/components/admin/VideoManager'
import { WikimediaCommonsSearch } from './WikimediaCommonsSearch'
import { AvailableImageSources } from './AvailableImageSources'
import { ImageIcon, Film } from 'lucide-react'
import type { Game, GameImage } from '@/types/database'

interface MediaTabProps {
  game: Game
  images: GameImage[]
  videos: GameVideo[]
  onImagesChange: (images: GameImage[]) => void
  onVideosChange: (videos: GameVideo[]) => void
  markUnsaved: () => void
}

export function MediaTab({
  game,
  images,
  videos,
  onImagesChange,
  onVideosChange,
  markUnsaved,
}: MediaTabProps) {
  // State for tracking image import
  const [importingImages, setImportingImages] = useState<Set<string>>(new Set())
  const [importedImages, setImportedImages] = useState<Set<string>>(new Set())

  // Import external image to gallery
  const importExternalImage = useCallback(async (
    url: string,
    source: 'wikipedia' | 'wikidata' | 'commons',
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
      onImagesChange([...images, image])
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
  }, [game.id, images, importingImages, importedImages, onImagesChange, markUnsaved])

  // Handlers for WikimediaCommonsSearch
  const handleImportStart = useCallback((key: string) => {
    setImportingImages(prev => new Set(prev).add(key))
  }, [])

  const handleImportEnd = useCallback((key: string, success: boolean) => {
    setImportingImages(prev => {
      const next = new Set(prev)
      next.delete(key)
      return next
    })
    if (success) {
      setImportedImages(prev => new Set(prev).add(key))
    }
  }, [])

  const handleCommonsImageImported = useCallback((image: unknown) => {
    onImagesChange([...images, image as GameImage])
    markUnsaved()
  }, [images, onImagesChange, markUnsaved])

  return (
    <div className="space-y-6">
      {/* Images Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <ImageIcon className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Images</CardTitle>
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
              onImagesChange(newImages)
              markUnsaved()
            }}
          />

          {/* Search Wikimedia Commons */}
          <WikimediaCommonsSearch
            gameName={game.name}
            gameId={game.id}
            images={images}
            onImageImported={handleCommonsImageImported}
            importingImages={importingImages}
            importedImages={importedImages}
            onImportStart={handleImportStart}
            onImportEnd={handleImportEnd}
          />

          {/* Available Image Sources */}
          <AvailableImageSources
            game={game}
            images={images}
            importingImages={importingImages}
            importedImages={importedImages}
            onImportImage={importExternalImage}
          />
        </CardContent>
      </Card>

      {/* Videos Section */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-red-500/10 flex items-center justify-center">
              <Film className="h-4 w-4 text-red-500" />
            </div>
            <div>
              <CardTitle className="text-lg uppercase">Videos</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">
                Add YouTube videos showcasing gameplay, reviews, and overviews.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <VideoManager
            gameId={game.id}
            videos={videos}
            onVideosChange={(newVideos) => {
              onVideosChange(newVideos)
              markUnsaved()
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
