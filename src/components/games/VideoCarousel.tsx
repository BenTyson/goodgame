'use client'

import { Play } from 'lucide-react'
import { cn } from '@/lib/utils'
import { getYouTubeThumbnailUrl } from '@/lib/utils/youtube'
import { useMediaModal } from '@/hooks/use-media-modal'
import { MediaModal } from './MediaModal'

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
  const {
    selectedIndex,
    isOpen,
    open,
    close,
    goToPrevious,
    goToNext,
  } = useMediaModal(videos.length)

  if (videos.length === 0) {
    return null
  }

  const selectedVideo = selectedIndex !== null ? videos[selectedIndex] : null

  return (
    <>
      {/* Thumbnail Strip */}
      <div className="relative -mx-1">
        <div className="flex gap-3 overflow-x-auto px-1 py-1 scrollbar-thin scrollbar-thumb-muted scrollbar-track-transparent">
          {videos.map((video, index) => (
            <button
              key={video.id}
              onClick={() => open(index)}
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
                  src={getYouTubeThumbnailUrl(video.youtube_video_id)}
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
      {selectedIndex !== null && selectedVideo && (
        <MediaModal
          isOpen={isOpen}
          currentIndex={selectedIndex + 1}
          totalItems={videos.length}
          onClose={close}
          onPrevious={goToPrevious}
          onNext={goToNext}
          ariaLabel="Video player"
          caption={selectedVideo.title}
        >
          {/* Video embed */}
          <div className="relative w-full max-w-5xl aspect-video">
            <iframe
              src={`https://www.youtube.com/embed/${selectedVideo.youtube_video_id}?autoplay=1&rel=0`}
              title={selectedVideo.title || 'Video player'}
              className="w-full h-full rounded-lg shadow-2xl"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </MediaModal>
      )}
    </>
  )
}
