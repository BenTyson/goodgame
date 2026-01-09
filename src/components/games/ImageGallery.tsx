'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { GameImage } from '@/types/database'

interface ImageGalleryProps {
  images: GameImage[]
  gameName: string
}

export function ImageGallery({ images, gameName }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const isLightboxOpen = selectedIndex !== null

  const goToPrevious = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === 0 ? images.length - 1 : selectedIndex - 1)
  }, [selectedIndex, images.length])

  const goToNext = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === images.length - 1 ? 0 : selectedIndex + 1)
  }, [selectedIndex, images.length])

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isLightboxOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isLightboxOpen, closeLightbox, goToPrevious, goToNext])

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
              onClick={() => setSelectedIndex(index)}
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
      {isLightboxOpen && selectedImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Image lightbox"
        >
          {/* Backdrop with blur */}
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeLightbox}
          />

          {/* Content container */}
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4 md:p-8">
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 md:p-6">
              {/* Counter */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white/90">
                  {selectedIndex + 1} / {images.length}
                </span>
                {selectedImage.image_type && (
                  <>
                    <span className="h-1 w-1 rounded-full bg-white/30" />
                    <span className="text-sm text-white/60 capitalize">
                      {selectedImage.image_type.replace('_', ' ')}
                    </span>
                  </>
                )}
              </div>

              {/* Close button */}
              <button
                onClick={closeLightbox}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  'bg-white/10 text-white/90 backdrop-blur-sm',
                  'transition-all duration-200 hover:bg-white/20 hover:scale-105',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                )}
                aria-label="Close lightbox"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Main image */}
            <div
              className="relative flex max-h-[75vh] max-w-[90vw] items-center justify-center animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={selectedImage.url}
                alt={selectedImage.alt_text || `${gameName} image`}
                width={selectedImage.width || 1200}
                height={selectedImage.height || 800}
                className="max-h-[75vh] w-auto rounded-lg object-contain shadow-2xl"
                priority
              />
            </div>

            {/* Caption */}
            {selectedImage.caption && (
              <p className="mt-4 max-w-2xl text-center text-sm text-white/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {selectedImage.caption}
              </p>
            )}

            {/* Navigation arrows */}
            {images.length > 1 && (
              <>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goToPrevious()
                  }}
                  className={cn(
                    'absolute left-4 md:left-8 top-1/2 -translate-y-1/2',
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    'bg-white/10 text-white/90 backdrop-blur-sm',
                    'transition-all duration-200 hover:bg-white/20 hover:scale-105',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                  )}
                  aria-label="Previous image"
                >
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    goToNext()
                  }}
                  className={cn(
                    'absolute right-4 md:right-8 top-1/2 -translate-y-1/2',
                    'flex h-12 w-12 items-center justify-center rounded-full',
                    'bg-white/10 text-white/90 backdrop-blur-sm',
                    'transition-all duration-200 hover:bg-white/20 hover:scale-105',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                  )}
                  aria-label="Next image"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}

            {/* Thumbnail strip in lightbox */}
            {images.length > 1 && (
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
            )}
          </div>
        </div>
      )}
    </>
  )
}
