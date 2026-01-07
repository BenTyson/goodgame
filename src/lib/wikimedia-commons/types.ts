/**
 * Wikimedia Commons API Types
 *
 * Type definitions for Wikimedia Commons API responses and internal data structures.
 * Commons is the media repository for Wikipedia - contains CC-licensed images.
 */

// =====================================================
// API Response Types
// =====================================================

/**
 * Commons API query response structure
 */
export interface CommonsQueryResponse {
  batchcomplete?: string
  continue?: {
    sroffset?: number
    continue?: string
  }
  query?: {
    search?: CommonsSearchHit[]
    pages?: Record<string, CommonsPageInfo>
  }
}

/**
 * Search result from Commons API
 */
export interface CommonsSearchHit {
  ns: number // Namespace (6 = File)
  title: string // File:Example.jpg
  pageid: number
  size?: number
  wordcount?: number
  snippet?: string // HTML snippet with search highlights
  timestamp?: string
}

/**
 * Page info from Commons API (for image details)
 */
export interface CommonsPageInfo {
  pageid: number
  ns: number
  title: string
  missing?: boolean
  imageinfo?: CommonsImageInfo[]
  categories?: { title: string }[]
}

/**
 * Image info from Commons API
 */
export interface CommonsImageInfo {
  url: string
  descriptionurl: string
  descriptionshorturl?: string
  thumburl?: string
  thumbwidth?: number
  thumbheight?: number
  width: number
  height: number
  size: number
  mime: string
  extmetadata?: CommonsExtMetadata
}

/**
 * Extended metadata from Commons (license, author, etc.)
 */
export interface CommonsExtMetadata {
  DateTime?: { value: string }
  ObjectName?: { value: string }
  ImageDescription?: { value: string }
  License?: { value: string }
  LicenseShortName?: { value: string }
  LicenseUrl?: { value: string }
  Artist?: { value: string }
  Credit?: { value: string }
  Categories?: { value: string }
  Copyrighted?: { value: string }
  UsageTerms?: { value: string }
}

// =====================================================
// Internal Types
// =====================================================

/**
 * Processed Commons image with clean data
 */
export interface CommonsImage {
  /** File title (e.g., "File:Catan-2015-box.jpg") */
  filename: string

  /** Full-resolution URL */
  url: string

  /** Thumbnail URL (resized) */
  thumbUrl: string

  /** Image dimensions */
  width: number
  height: number

  /** File size in bytes */
  size: number

  /** MIME type */
  mime: string

  /** License info */
  license: string
  licenseUrl?: string

  /** Attribution */
  author?: string
  credit?: string

  /** Image description */
  description?: string

  /** Categories this image belongs to */
  categories?: string[]

  /** URL to Commons description page */
  commonsUrl: string

  /** Whether this appears to be a primary/cover image */
  isPrimary?: boolean
}

/**
 * Result from Commons search
 */
export interface CommonsSearchResult {
  /** Found images */
  images: CommonsImage[]

  /** Total results available (may be more than returned) */
  totalHits: number

  /** Whether there are more results available */
  hasMore: boolean

  /** Search query used */
  query: string
}

/**
 * Options for Commons search
 */
export interface CommonsSearchOptions {
  /** Maximum images to return (default 10) */
  limit?: number

  /** Thumbnail width for preview (default 400) */
  thumbWidth?: number

  /** Filter to specific categories */
  categories?: string[]

  /** Exclude images with these patterns in filename */
  excludePatterns?: string[]

  /** Only include images with CC licenses */
  requireCC?: boolean
}
