/**
 * YouTube Data API v3 client for video search
 *
 * Quota: 10,000 units/day
 * - Search costs 100 units per request
 * - Video details costs 1 unit per request
 */

import type {
  YouTubeVideo,
  YouTubeSearchResult,
  YouTubeSearchResponse,
  YouTubeVideoDetailsResponse,
} from './types'

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3'

/**
 * Parse ISO 8601 duration to human-readable format
 * PT12M34S -> "12:34"
 * PT1H2M3S -> "1:02:03"
 */
function parseDuration(isoDuration: string): string {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return ''

  const hours = parseInt(match[1] || '0', 10)
  const minutes = parseInt(match[2] || '0', 10)
  const seconds = parseInt(match[3] || '0', 10)

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`
}

/**
 * Format view count to human-readable format
 * 1234567 -> "1.2M"
 */
function formatViewCount(count: string): string {
  const num = parseInt(count, 10)
  if (isNaN(num)) return count

  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return count
}

/**
 * Search YouTube for videos
 */
export async function searchYouTube(
  query: string,
  limit: number = 6
): Promise<YouTubeSearchResult> {
  const apiKey = process.env.YOUTUBE_API_KEY

  if (!apiKey) {
    throw new Error('YOUTUBE_API_KEY environment variable is not set')
  }

  // Build the YouTube search URL for manual fallback
  const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`

  // Search for videos
  const searchParams = new URLSearchParams({
    part: 'snippet',
    q: query,
    type: 'video',
    maxResults: limit.toString(),
    key: apiKey,
    order: 'relevance',
  })

  const searchResponse = await fetch(
    `${YOUTUBE_API_BASE}/search?${searchParams.toString()}`
  )

  if (!searchResponse.ok) {
    const error = await searchResponse.json()
    console.error('YouTube search error:', error)

    if (error.error?.errors?.[0]?.reason === 'quotaExceeded') {
      throw new Error('YouTube API quota exceeded. Try again tomorrow.')
    }

    throw new Error(error.error?.message || 'YouTube search failed')
  }

  const searchData: YouTubeSearchResponse = await searchResponse.json()

  if (!searchData.items || searchData.items.length === 0) {
    return { videos: [], youtubeSearchUrl }
  }

  // Get video IDs for fetching duration and view counts
  const videoIds = searchData.items.map(item => item.id.videoId).join(',')

  // Fetch video details (duration, view count)
  const detailsParams = new URLSearchParams({
    part: 'contentDetails,statistics',
    id: videoIds,
    key: apiKey,
  })

  const detailsResponse = await fetch(
    `${YOUTUBE_API_BASE}/videos?${detailsParams.toString()}`
  )

  let detailsMap: Map<string, { duration?: string; viewCount?: string }> = new Map()

  if (detailsResponse.ok) {
    const detailsData: YouTubeVideoDetailsResponse = await detailsResponse.json()

    for (const item of detailsData.items) {
      detailsMap.set(item.id, {
        duration: parseDuration(item.contentDetails.duration),
        viewCount: formatViewCount(item.statistics.viewCount),
      })
    }
  }

  // Map search results to our format
  const videos: YouTubeVideo[] = searchData.items.map(item => {
    const details = detailsMap.get(item.id.videoId)

    return {
      videoId: item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnailUrl: item.snippet.thumbnails.medium?.url || item.snippet.thumbnails.default.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: item.snippet.publishedAt,
      duration: details?.duration,
      viewCount: details?.viewCount,
    }
  })

  return { videos, youtubeSearchUrl }
}
