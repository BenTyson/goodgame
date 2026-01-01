'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { TempImage } from '@/components/admin/TempImage'
import { ImageIcon, CheckCircle2 } from 'lucide-react'
import type { Game, GameImage } from '@/types/database'

interface ImagesStepProps {
  game: Game
  images: GameImage[]
  onImagesChange: (images: GameImage[]) => void
  onComplete: () => void
  onSkip: () => void
}

export function ImagesStep({
  game,
  images,
  onImagesChange,
  onComplete,
  onSkip,
}: ImagesStepProps) {
  // Check if step is complete (has at least one image)
  const hasImages = images.length > 0

  useEffect(() => {
    if (hasImages) {
      onComplete()
    }
  }, [hasImages, onComplete])

  const bggReferenceImage = (game.bgg_raw_data as { reference_images?: { box?: string } })
    ?.reference_images?.box

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-green-500/10 flex items-center justify-center">
            <ImageIcon className="h-5 w-5 text-green-500" />
          </div>
          <div>
            <CardTitle>Upload Game Images</CardTitle>
            <CardDescription>
              Add cover art and gallery images. The primary image will appear on game cards and as the hero.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status indicator */}
        {hasImages && (
          <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-4 w-4" />
            <span>
              {images.length} image{images.length !== 1 ? 's' : ''} uploaded
              {images.some((img) => img.is_primary) && ' • Primary set'}
            </span>
          </div>
        )}

        {/* Image Upload */}
        <ImageUpload
          gameId={game.id}
          gameSlug={game.slug}
          images={images}
          onImagesChange={onImagesChange}
        />

        {/* BGG Reference Image */}
        {!hasImages && bggReferenceImage && (
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
                src={bggReferenceImage}
                alt={`${game.name} reference`}
                aspectRatio="4/3"
                className="max-w-md rounded-lg overflow-hidden"
              />
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  )
}
