'use client'

import { useState, useEffect, useCallback } from 'react'
import { Play, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoData {
  id: string
  youtube_video_id: string
  title: string | null
  video_type: string
}

interface VideoCarouselProps {
  videos: VideoData[]
  gameName: string
}

export function VideoCarousel({ videos, gameName }: VideoCarouselProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const isModalOpen = selectedIndex !== null

  const goToPrevious = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === 0 ? videos.length - 1 : selectedIndex - 1)
  }, [selectedIndex, videos.length])

  const goToNext = useCallback(() => {
    if (selectedIndex === null) return
    setSelectedIndex(selectedIndex === videos.length - 1 ? 0 : selectedIndex + 1)
  }, [selectedIndex, videos.length])

  const closeModal = useCallback(() => {
    setSelectedIndex(null)
  }, [])

  // Keyboard navigation
  useEffect(() => {
    if (!isModalOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeModal()
      if (e.key === 'ArrowLeft') goToPrevious()
      if (e.key === 'ArrowRight') goToNext()
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isModalOpen, closeModal, goToPrevious, goToNext])

  if (videos.length === 0) {
    return null
  }

  const selectedVideo = selectedIndex !== null ? videos[selectedIndex] : null

  const getThumbnailUrl = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  }

  return (
    <>
      {/* Thumbnail Strip */}
      <div className="relative -mx-1">
        <div className="flex gap-3 overflow-x-auto px-1 py-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => setSelectedIndex(index)}
              className={cn(
                'group relative shrink-0 overflow-hidden rounded-xl bg-muted',
                'ring-offset-background transition-all duration-200',
                'hover:ring-2 hover:ring-primary hover:ring-offset-2',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2'
              )}
              aria-label={`Watch ${video.title || `video ${index + 1}`}`}
            >
              <div className="relative w-72 aspect-video">
                <img
                  src={getThumbnailUrl(video.youtube_video_id)}
                  alt={video.title || `${gameName} video ${index + 1}`}
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />

                {/* Subtle play icon - appears on hover */}
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 transition-colors duration-200">
                  <div className={cn(
                    'h-12 w-12 rounded-full bg-white/90 flex items-center justify-center',
                    'opacity-0 group-hover:opacity-100 transition-all duration-200',
                    'group-hover:scale-100 scale-90'
                  )}>
                    <Play className="h-5 w-5 text-black ml-0.5" fill="black" />
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        {/* Fade edge for scroll indication */}
        {videos.length > 4 && (
          <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
        )}
      </div>

      {/* Video Modal */}
      {isModalOpen && selectedVideo && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          role="dialog"
          aria-modal="true"
          aria-label="Video player"
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={closeModal}
          />

          {/* Content container */}
          <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4 md:p-8">
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 md:p-6">
              {/* Counter */}
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-white/90">
                  {selectedIndex + 1} / {videos.length}
                </span>
              </div>

              {/* Close button */}
              <button
                onClick={closeModal}
                className={cn(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  'bg-white/10 text-white/90 backdrop-blur-sm',
                  'transition-all duration-200 hover:bg-white/20 hover:scale-105',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
                )}
                aria-label="Close video"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Video embed */}
            <div
              className="relative w-full max-w-5xl aspect-video animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <iframe
                src={`https://www.youtube.com/embed/${selectedVideo.youtube_video_id}?autoplay=1&rel=0`}
                title={selectedVideo.title || 'Video player'}
                className="w-full h-full rounded-lg shadow-2xl"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>

            {/* Video title */}
            {selectedVideo.title && (
              <p className="mt-4 max-w-2xl text-center text-sm text-white/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
                {selectedVideo.title}
              </p>
            )}

            {/* Navigation arrows */}
            {videos.length > 1 && (
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
                  aria-label="Previous video"
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
                  aria-label="Next video"
                >
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
