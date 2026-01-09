'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  Youtube,
  Search,
  Loader2,
  Plus,
  Check,
  ExternalLink,
  Clock,
  Eye,
  Clapperboard,
  Gamepad2,
  MessageSquareQuote,
} from 'lucide-react'
import type { YouTubeVideo } from '@/lib/youtube/types'
import type { GameVideo, VideoType } from '@/components/admin/VideoManager'

const VIDEO_TYPES: { value: VideoType; label: string; icon: React.ReactNode }[] = [
  { value: 'overview', label: 'Overview', icon: <Clapperboard className="h-4 w-4" /> },
  { value: 'gameplay', label: 'Gameplay', icon: <Gamepad2 className="h-4 w-4" /> },
  { value: 'review', label: 'Review', icon: <MessageSquareQuote className="h-4 w-4" /> },
]

interface YouTubeVideoSearchProps {
  gameName: string
  gameId: string
  videos: GameVideo[]
  onVideoAdded: (video: GameVideo) => void
  importingVideos: Set<string>
  importedVideos: Set<string>
  onImportStart: (key: string) => void
  onImportEnd: (key: string, success: boolean) => void
}

export function YouTubeVideoSearch({
  gameName,
  gameId,
  videos,
  onVideoAdded,
  importingVideos,
  importedVideos,
  onImportStart,
  onImportEnd,
}: YouTubeVideoSearchProps) {
  const [searchQuery, setSearchQuery] = useState(`${gameName} Board Game Overview`)
  const [searchResults, setSearchResults] = useState<YouTubeVideo[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchUrl, setSearchUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [addingVideoId, setAddingVideoId] = useState<string | null>(null)

  const isVideoInGallery = (videoId: string) => {
    return videos.some(v => v.youtube_video_id === videoId)
  }

  const searchYouTube = async () => {
    if (!searchQuery.trim() || searching) return

    setSearching(true)
    setSearchResults([])
    setSearched(false)
    setError(null)

    try {
      const response = await fetch(
        `/api/admin/youtube/search?q=${encodeURIComponent(searchQuery)}&limit=6`
      )

      const data = await response.json()

      if (!response.ok) {
        if (data.setupRequired) {
          setError('YouTube API key not configured. Add YOUTUBE_API_KEY to .env.local')
        } else if (data.quotaExceeded) {
          setError('YouTube API quota exceeded. Try again tomorrow.')
          setSearchUrl(data.youtubeSearchUrl)
        } else {
          setError(data.error || 'Search failed')
        }
        return
      }

      setSearchResults(data.videos || [])
      setSearchUrl(data.youtubeSearchUrl || null)
      setSearched(true)
    } catch (err) {
      console.error('YouTube search failed:', err)
      setError('Search failed. Please try again.')
    } finally {
      setSearching(false)
    }
  }

  const addVideo = async (video: YouTubeVideo, videoType: VideoType) => {
    const videoKey = `youtube:${video.videoId}`
    if (importingVideos.has(videoKey) || importedVideos.has(videoKey)) return

    onImportStart(videoKey)
    setAddingVideoId(video.videoId)

    try {
      const response = await fetch('/api/admin/game-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          youtubeUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
          youtubeVideoId: video.videoId,
          videoType,
          title: video.title,
          displayOrder: videos.length,
          isFeatured: videos.length === 0, // First video is featured
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add video')
      }

      const { video: savedVideo } = await response.json()
      onVideoAdded(savedVideo)
      onImportEnd(videoKey, true)
    } catch (err) {
      console.error('Failed to add video:', err)
      onImportEnd(videoKey, false)
    } finally {
      setAddingVideoId(null)
    }
  }

  return (
    <Card className="border-dashed border-red-500/30 bg-red-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-red-600 flex items-center justify-center">
            <Youtube className="h-3 w-3 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm">Search YouTube</CardTitle>
            <CardDescription className="text-xs">
              Find videos about this game on YouTube
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search form */}
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for videos..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && searchYouTube()}
          />
          <Button
            onClick={searchYouTube}
            disabled={searching || !searchQuery.trim()}
            size="sm"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </div>

        {/* Error message */}
        {error && (
          <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/50 p-3 rounded-lg">
            {error}
            {searchUrl && (
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-red-700 dark:text-red-400 hover:underline text-xs"
              >
                Search manually on YouTube
              </a>
            )}
          </div>
        )}

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Found {searchResults.length} videos
              </p>
              {searchUrl && (
                <a
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-red-600 hover:underline flex items-center gap-1"
                >
                  View all on YouTube
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {searchResults.map((video) => {
                const videoKey = `youtube:${video.videoId}`
                const isImporting = importingVideos.has(videoKey) || addingVideoId === video.videoId
                const isImported = importedVideos.has(videoKey) || isVideoInGallery(video.videoId)

                return (
                  <div key={video.videoId} className="relative group">
                    <div className="aspect-video rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={video.thumbnailUrl}
                        alt={video.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* YouTube badge */}
                    <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-red-600 text-white flex items-center gap-1">
                      <Youtube className="h-2.5 w-2.5" />
                    </span>
                    {/* Duration badge */}
                    {video.duration && (
                      <span className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-black/80 text-white flex items-center gap-1">
                        <Clock className="h-2.5 w-2.5" />
                        {video.duration}
                      </span>
                    )}
                    {/* View count badge */}
                    {video.viewCount && (
                      <span className="absolute bottom-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-black/80 text-white flex items-center gap-1">
                        <Eye className="h-2.5 w-2.5" />
                        {video.viewCount}
                      </span>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 p-2">
                      {isImported ? (
                        <span className="flex items-center gap-1 text-xs text-white bg-green-600 px-2 py-1 rounded">
                          <Check className="h-3 w-3" />
                          Added
                        </span>
                      ) : (
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={isImporting}
                              className="text-xs"
                            >
                              {isImporting ? (
                                <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                              ) : (
                                <Plus className="h-3 w-3 mr-1" />
                              )}
                              Add Video
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-48 p-2" align="center">
                            <p className="text-xs text-muted-foreground mb-2">Select video type:</p>
                            <div className="space-y-1">
                              {VIDEO_TYPES.map((type) => (
                                <Button
                                  key={type.value}
                                  variant="ghost"
                                  size="sm"
                                  className="w-full justify-start text-xs"
                                  onClick={() => addVideo(video, type.value)}
                                >
                                  {type.icon}
                                  <span className="ml-2">{type.label}</span>
                                </Button>
                              ))}
                            </div>
                          </PopoverContent>
                        </Popover>
                      )}
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-white/80 hover:text-white flex items-center gap-1"
                      >
                        <ExternalLink className="h-3 w-3" />
                        Watch on YouTube
                      </a>
                    </div>
                    {/* Title below thumbnail */}
                    <div className="mt-1.5 px-0.5">
                      <p className="text-xs font-medium line-clamp-2 leading-tight">
                        {video.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {video.channelTitle}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No results message */}
        {searched && searchResults.length === 0 && !error && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No videos found. Try a different search term.
            {searchUrl && (
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-red-600 hover:underline text-xs"
              >
                Search manually on YouTube
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
