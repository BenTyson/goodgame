'use client'

import { useState } from 'react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

interface ListingImage {
  id: string
  url: string
  display_order: number
  is_primary: boolean
}

interface ImageGalleryProps {
  images: ListingImage[]
  gameName: string
  fallbackImage?: string | null
}

export function ImageGallery({ images, gameName, fallbackImage }: ImageGalleryProps) {
  // Sort images by display_order and find primary
  const sortedImages = [...images].sort((a, b) => a.display_order - b.display_order)
  const primaryIndex = sortedImages.findIndex(img => img.is_primary)
  const initialIndex = primaryIndex >= 0 ? primaryIndex : 0

  const [selectedIndex, setSelectedIndex] = useState(initialIndex)

  // Determine what to show
  const hasImages = sortedImages.length > 0
  const selectedImage = hasImages ? sortedImages[selectedIndex]?.url : fallbackImage

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div className="relative w-full max-h-[400px] aspect-[4/3] bg-muted rounded-lg overflow-hidden">
        {selectedImage ? (
          <Image
            src={selectedImage}
            alt={gameName}
            fill
            className="object-contain"
            priority
            sizes="(max-width: 768px) 100vw, 40vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl font-bold text-muted-foreground">
            {gameName.charAt(0)}
          </div>
        )}
      </div>

      {/* Thumbnail Strip */}
      {sortedImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sortedImages.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted transition-all',
                'hover:ring-2 hover:ring-primary/50',
                selectedIndex === index
                  ? 'ring-2 ring-primary'
                  : 'ring-1 ring-border'
              )}
            >
              <Image
                src={image.url}
                alt={`${gameName} - Image ${index + 1}`}
                fill
                className="object-cover"
                sizes="64px"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
