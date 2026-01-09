/**
 * YouTube Data API v3 types for video search
 */

export interface YouTubeVideo {
  videoId: string
  title: string
  description: string
  thumbnailUrl: string      // mqdefault (320x180)
  channelTitle: string
  publishedAt: string
  duration?: string         // Human-readable format (e.g., "12:34")
  viewCount?: string        // Formatted view count
}

export interface YouTubeSearchResult {
  videos: YouTubeVideo[]
  youtubeSearchUrl: string  // Link to manual YouTube search
}

// YouTube API response types
export interface YouTubeSearchResponse {
  items: YouTubeSearchItem[]
  nextPageToken?: string
  pageInfo: {
    totalResults: number
    resultsPerPage: number
  }
}

export interface YouTubeSearchItem {
  id: {
    kind: string
    videoId: string
  }
  snippet: {
    publishedAt: string
    channelId: string
    title: string
    description: string
    thumbnails: {
      default: YouTubeThumbnail
      medium: YouTubeThumbnail
      high: YouTubeThumbnail
    }
    channelTitle: string
    liveBroadcastContent: string
  }
}

export interface YouTubeThumbnail {
  url: string
  width: number
  height: number
}

export interface YouTubeVideoDetailsResponse {
  items: YouTubeVideoDetailsItem[]
}

export interface YouTubeVideoDetailsItem {
  id: string
  contentDetails: {
    duration: string  // ISO 8601 format (PT12M34S)
  }
  statistics: {
    viewCount: string
    likeCount?: string
  }
}
