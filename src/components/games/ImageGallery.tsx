'use client'

import Image from 'next/image'

import { cn } from '@/lib/utils'
import { useMediaModal } from '@/hooks/use-media-modal'
import { MediaModal } from './MediaModal'
import type { GameImage } from '@/types/database'

interface ImageGalleryProps {
  images: GameImage[]
  gameName: string
}

export function ImageGallery({ images, gameName }: ImageGalleryProps) {
  const {
    selectedIndex,
    isOpen,
    open,
    close,
    goToPrevious,
    goToNext,
    setSelectedIndex,
  } = useMediaModal(images.length)

  if (images.length === 0) {
    return null
  }

  const selectedImage = selectedIndex !== null ? images[selectedIndex] : null

  return (
    <>
      {/* Thumbnail Strip */}
      <div className="relative -mx-1">
        <div className="flex gap-3 overflow-x-auto px-1 py-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {images.map((image, index) => (
            <button
              key={image.id}
              onClick={() => open(index)}
              className={cn(
                'group relative h-32 w-44 shrink-0 overflow-hidden rounded-xl bg-muted',
                'ring-offset-background transition-all duration-200',
                'hover:ring-2 hover:ring-primary hover:ring-offset-2',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              )}
              aria-label={`View ${image.alt_text || `image ${index + 1}`}`}
            >
              <Image
                src={image.url}
                alt={image.alt_text || `${gameName} thumbnail ${index + 1}`}
                fill
                className="object-cover transition-transform duration-300 group-hover:scale-105"
                sizes="176px"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 transition-colors duration-200 group-hover:bg-black/10" />
            </button>
          ))}
        </div>

        {/* Fade edges for scroll indication */}
        {images.length > 4 && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
        )}
      </div>

      {/* Lightbox */}
      {selectedIndex !== null && selectedImage && (
        <MediaModal
          isOpen={isOpen}
          currentIndex={selectedIndex + 1}
          totalItems={images.length}
          onClose={close}
          onPrevious={goToPrevious}
          onNext={goToNext}
          ariaLabel="Image lightbox"
          topBarExtra={
            selectedImage.image_type && (
              <>
                <span className="h-1 w-1 rounded-full bg-white/30" />
                <span className="text-sm text-white/60 capitalize">
                  {selectedImage.image_type.replace('_', ' ')}
                </span>
              </>
            )
          }
          caption={selectedImage.caption}
          bottomContent={
            images.length > 1 && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 rounded-full bg-black/40 p-2 backdrop-blur-sm animate-in fade-in slide-in-from-bottom-4 duration-300">
                {images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedIndex(index)
                    }}
                    className={cn(
                      'relative h-12 w-16 shrink-0 overflow-hidden rounded-md transition-all duration-200',
                      index === selectedIndex
                        ? 'ring-2 ring-white ring-offset-1 ring-offset-black/50 scale-105'
                        : 'opacity-50 hover:opacity-80'
                    )}
                    aria-label={`View image ${index + 1}`}
                  >
                    <Image
                      src={image.url}
                      alt={image.alt_text || `Thumbnail ${index + 1}`}
                      fill
                      className="object-cover"
                      sizes="64px"
                    />
                  </button>
                ))}
              </div>
            )
          }
        >
          {/* Main image */}
          <div className="relative flex max-h-[75vh] max-w-[90vw] items-center justify-center">
            <Image
              src={selectedImage.url}
              alt={selectedImage.alt_text || `${gameName} image`}
              width={selectedImage.width || 1200}
              height={selectedImage.height || 800}
              className="max-h-[75vh] w-auto rounded-lg object-contain shadow-2xl"
              priority
            />
          </div>
        </MediaModal>
      )}
    </>
  )
}
