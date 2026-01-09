'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import {
  Plus,
  Trash2,
  Play,
  Star,
  Loader2,
  Youtube,
  Clapperboard,
  Gamepad2,
  MessageSquareQuote,
  GripVertical,
  ExternalLink,
} from 'lucide-react'

export type VideoType = 'overview' | 'gameplay' | 'review'

export interface GameVideo {
  id: string
  game_id: string
  youtube_url: string
  youtube_video_id: string
  title: string | null
  video_type: VideoType
  display_order: number
  is_featured: boolean
  created_at: string
  updated_at: string
}

interface VideoManagerProps {
  gameId: string
  videos: GameVideo[]
  onVideosChange: (videos: GameVideo[]) => void
}

const VIDEO_TYPES: { value: VideoType; label: string; icon: React.ReactNode; description: string }[] = [
  { value: 'overview', label: 'General Overview', icon: <Clapperboard className="h-4 w-4" />, description: 'Introduction or overview of the game' },
  { value: 'gameplay', label: 'Gameplay/Walkthrough', icon: <Gamepad2 className="h-4 w-4" />, description: 'How to play, rules explanation' },
  { value: 'review', label: 'Review', icon: <MessageSquareQuote className="h-4 w-4" />, description: 'Opinions and recommendations' },
]

// Extract YouTube video ID from various URL formats
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/shorts\/([^&\n?#]+)/,
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}

export function VideoManager({ gameId, videos, onVideosChange }: VideoManagerProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [addModalOpen, setAddModalOpen] = useState(false)
  const [newVideoUrl, setNewVideoUrl] = useState('')
  const [newVideoType, setNewVideoType] = useState<VideoType>('overview')
  const [newVideoTitle, setNewVideoTitle] = useState('')
  const [urlError, setUrlError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const validateUrl = (url: string) => {
    if (!url.trim()) {
      setUrlError(null)
      return false
    }
    const videoId = extractYouTubeId(url)
    if (!videoId) {
      setUrlError('Please enter a valid YouTube URL')
      return false
    }
    // Check if already added
    if (videos.some(v => v.youtube_video_id === videoId)) {
      setUrlError('This video has already been added')
      return false
    }
    setUrlError(null)
    return true
  }

  const handleAddVideo = async () => {
    if (!validateUrl(newVideoUrl)) return

    const videoId = extractYouTubeId(newVideoUrl)
    if (!videoId) return

    setIsAdding(true)

    try {
      const response = await fetch('/api/admin/game-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          youtubeUrl: newVideoUrl,
          youtubeVideoId: videoId,
          videoType: newVideoType,
          title: newVideoTitle || null,
          displayOrder: videos.length,
          isFeatured: videos.length === 0, // First video is featured by default
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to add video')
      }

      const { video } = await response.json()
      onVideosChange([...videos, video])

      // Reset form
      setAddModalOpen(false)
      setNewVideoUrl('')
      setNewVideoType('overview')
      setNewVideoTitle('')
      setUrlError(null)
    } catch (error) {
      console.error('Failed to add video:', error)
      setUrlError(error instanceof Error ? error.message : 'Failed to add video')
    } finally {
      setIsAdding(false)
    }
  }

  const handleDeleteVideo = async (videoId: string) => {
    setDeletingId(videoId)

    try {
      const response = await fetch('/api/admin/game-videos', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId }),
      })

      if (!response.ok) {
        throw new Error('Failed to delete video')
      }

      onVideosChange(videos.filter(v => v.id !== videoId))
    } catch (error) {
      console.error('Failed to delete video:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleSetFeatured = async (videoId: string) => {
    try {
      const response = await fetch('/api/admin/game-videos', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ videoId, isFeatured: true, gameId }),
      })

      if (!response.ok) {
        throw new Error('Failed to update video')
      }

      // Update local state - clear other featured, set this one
      onVideosChange(videos.map(v => ({
        ...v,
        is_featured: v.id === videoId,
      })))
    } catch (error) {
      console.error('Failed to set featured:', error)
    }
  }

  const getVideoTypeConfig = (type: VideoType) => {
    return VIDEO_TYPES.find(t => t.value === type) || VIDEO_TYPES[0]
  }

  const getThumbnailUrl = (videoId: string) => {
    return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`
  }

  // Sort videos: featured first, then by display order
  const sortedVideos = [...videos].sort((a, b) => {
    if (a.is_featured && !b.is_featured) return -1
    if (!a.is_featured && b.is_featured) return 1
    return a.display_order - b.display_order
  })

  return (
    <div className="space-y-4">
      {/* Add Video Button */}
      <Button
        variant="outline"
        onClick={() => setAddModalOpen(true)}
        className="w-full border-dashed gap-2"
      >
        <Plus className="h-4 w-4" />
        Add YouTube Video
      </Button>

      {/* Video Grid */}
      {sortedVideos.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedVideos.map((video) => {
            const typeConfig = getVideoTypeConfig(video.video_type)
            const isDeleting = deletingId === video.id

            return (
              <Card
                key={video.id}
                className={cn(
                  'relative overflow-hidden group',
                  video.is_featured && 'ring-2 ring-amber-500 ring-offset-2 ring-offset-background'
                )}
              >
                {/* Thumbnail */}
                <div className="relative aspect-video bg-muted">
                  <img
                    src={getThumbnailUrl(video.youtube_video_id)}
                    alt={video.title || 'Video thumbnail'}
                    className="w-full h-full object-cover"
                  />

                  {/* Play button overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-12 w-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                      <Play className="h-5 w-5 text-white ml-0.5" fill="white" />
                    </div>
                  </div>

                  {/* Featured badge */}
                  {video.is_featured && (
                    <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                      <Star className="h-3 w-3 fill-current" />
                      Featured
                    </div>
                  )}

                  {/* Type badge */}
                  <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 text-white text-xs px-2 py-1 rounded">
                    {typeConfig.icon}
                    <span className="hidden sm:inline">{typeConfig.label}</span>
                  </div>

                  {/* Hover actions */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <a
                      href={video.youtube_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="h-9 w-9 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                      title="Open in YouTube"
                    >
                      <ExternalLink className="h-4 w-4 text-white" />
                    </a>
                    {!video.is_featured && (
                      <Button
                        type="button"
                        variant="secondary"
                        size="icon"
                        className="h-9 w-9 rounded-full"
                        onClick={() => handleSetFeatured(video.id)}
                        title="Set as featured"
                      >
                        <Star className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      className="h-9 w-9 rounded-full"
                      onClick={() => handleDeleteVideo(video.id)}
                      disabled={isDeleting}
                      title="Delete video"
                    >
                      {isDeleting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Video info */}
                <div className="p-3 space-y-1">
                  <p className="text-sm font-medium line-clamp-2">
                    {video.title || 'Untitled Video'}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Youtube className="h-3 w-3 text-red-500" />
                    <span>{typeConfig.label}</span>
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-8 text-muted-foreground">
          <Youtube className="h-10 w-10 mx-auto mb-3 opacity-50" />
          <p className="font-medium">No videos yet</p>
          <p className="text-sm">Add YouTube videos to showcase this game</p>
        </div>
      )}

      {/* Add Video Modal */}
      <Dialog open={addModalOpen} onOpenChange={setAddModalOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              Add YouTube Video
            </DialogTitle>
            <DialogDescription>
              Paste a YouTube URL to add a video to this game.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* YouTube URL */}
            <div className="space-y-2">
              <Label htmlFor="youtube-url">YouTube URL</Label>
              <Input
                id="youtube-url"
                placeholder="https://youtube.com/watch?v=..."
                value={newVideoUrl}
                onChange={(e) => {
                  setNewVideoUrl(e.target.value)
                  if (e.target.value) validateUrl(e.target.value)
                }}
                className={urlError ? 'border-red-500' : ''}
              />
              {urlError && (
                <p className="text-xs text-red-500">{urlError}</p>
              )}
              {newVideoUrl && !urlError && extractYouTubeId(newVideoUrl) && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img
                    src={getThumbnailUrl(extractYouTubeId(newVideoUrl)!)}
                    alt="Video preview"
                    className="w-full aspect-video object-cover"
                  />
                </div>
              )}
            </div>

            {/* Video Type */}
            <div className="space-y-2">
              <Label>Video Type</Label>
              <div className="grid grid-cols-3 gap-2">
                {VIDEO_TYPES.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    onClick={() => setNewVideoType(type.value)}
                    className={cn(
                      'flex flex-col items-center gap-1.5 p-3 rounded-lg border transition-colors text-center',
                      newVideoType === type.value
                        ? 'border-primary bg-primary/5 ring-1 ring-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    {type.icon}
                    <span className="text-xs font-medium">{type.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Title (Optional) */}
            <div className="space-y-2">
              <Label htmlFor="video-title">Custom Title (optional)</Label>
              <Input
                id="video-title"
                placeholder="Leave blank to use YouTube title"
                value={newVideoTitle}
                onChange={(e) => setNewVideoTitle(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setAddModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddVideo}
              disabled={isAdding || !newVideoUrl || !!urlError}
            >
              {isAdding ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Video
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
