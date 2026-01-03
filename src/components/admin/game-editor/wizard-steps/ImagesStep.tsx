'use client'

import { useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ImageUpload } from '@/components/admin/ImageUpload'
import { SourcedImage } from '@/components/admin/TempImage'
import { ImageIcon, CheckCircle2 } from 'lucide-react'
import type { Game, GameImage } from '@/types/database'
import { WizardStepHeader } from './WizardStepHeader'

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

  const bggReferenceImage = (game.bgg_raw_data as { image?: string | null })?.image

  return (
    <Card>
      <WizardStepHeader
        stepNumber={5}
        title="Upload Game Images"
        description="Add cover art and gallery images. The primary image will appear on game cards and as the hero."
        icon={<ImageIcon className="h-5 w-5" />}
        isComplete={hasImages}
        badge={hasImages ? `${images.length} image${images.length !== 1 ? 's' : ''}` : undefined}
      />
      <CardContent className="space-y-5 pt-0">

        {/* Image Upload */}
        <ImageUpload
          gameId={game.id}
          gameSlug={game.slug}
          images={images}
          onImagesChange={onImagesChange}
        />

        {/* Wikidata CC-licensed image */}
        {!hasImages && game.wikidata_image_url && (
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

        {/* BGG Reference Image */}
        {!hasImages && !game.wikidata_image_url && bggReferenceImage && (
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
                src={bggReferenceImage}
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
  )
}
