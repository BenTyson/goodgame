/**
 * YouTube utilities
 * Shared helpers for YouTube video handling
 */

/** YouTube thumbnail quality options */
export type YouTubeThumbnailQuality =
  | 'default'      // 120x90
  | 'mqdefault'    // 320x180
  | 'hqdefault'    // 480x360
  | 'sddefault'    // 640x480
  | 'maxresdefault' // 1280x720 (may not exist)

/**
 * Get YouTube thumbnail URL for a video
 * @param videoId - YouTube video ID
 * @param quality - Thumbnail quality (default: 'mqdefault' - 320x180)
 */
export function getYouTubeThumbnailUrl(
  videoId: string,
  quality: YouTubeThumbnailQuality = 'mqdefault'
): string {
  return `https://img.youtube.com/vi/${videoId}/${quality}.jpg`
}

/**
 * Get YouTube embed URL for iframe
 * @param videoId - YouTube video ID
 * @param options - Embed options
 */
export function getYouTubeEmbedUrl(
  videoId: string,
  options: {
    autoplay?: boolean
    mute?: boolean
    controls?: boolean
  } = {}
): string {
  const params = new URLSearchParams()

  if (options.autoplay) params.set('autoplay', '1')
  if (options.mute) params.set('mute', '1')
  if (options.controls === false) params.set('controls', '0')

  const queryString = params.toString()
  return `https://www.youtube.com/embed/${videoId}${queryString ? `?${queryString}` : ''}`
}

/**
 * Extract video ID from various YouTube URL formats
 * Returns null if not a valid YouTube URL
 */
export function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /^([a-zA-Z0-9_-]{11})$/, // Direct video ID
  ]

  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }

  return null
}
