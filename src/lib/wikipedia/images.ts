/**
 * Wikipedia Image Extraction
 *
 * Extracts images from Wikipedia articles with metadata from Wikimedia Commons.
 * Filters for relevant game images (box art, gameplay) and excludes icons/logos.
 */

import {
  getPageImages,
  getImageInfo,
  extractTitleFromUrl,
  getFirstPage,
} from './client'
import type { WikipediaImage } from './types'

// =====================================================
// Image Extraction
// =====================================================

/**
 * Extract images from a Wikipedia article with full metadata
 *
 * @param articleUrl - Wikipedia article URL
 * @param maxImages - Maximum number of images to return (default 5)
 * @returns Array of images with URLs and metadata
 */
export async function extractArticleImages(
  articleUrl: string,
  maxImages: number = 5
): Promise<WikipediaImage[]> {
  const images: WikipediaImage[] = []

  try {
    const title = extractTitleFromUrl(articleUrl)
    if (!title) return images

    // Step 1: Get image file names from article
    const imagesResponse = await getPageImages(title, 20)
    const page = getFirstPage(imagesResponse)
    if (!page?.images) return images

    // Filter out common non-game images
    const relevantImages = page.images
      .map((img) => img.title)
      .filter((filename) => isRelevantImage(filename))
      .slice(0, maxImages + 2) // Get a few extra in case some fail

    if (relevantImages.length === 0) return images

    // Step 2: Get image info (URLs, dimensions, license) from Commons
    const infoResponse = await getImageInfo(relevantImages, 600)
    const infoPages = infoResponse.query?.pages

    if (!infoPages) return images

    let isPrimarySet = false

    for (const pageId of Object.keys(infoPages)) {
      const infoPage = infoPages[pageId]
      if (!infoPage.imageinfo?.[0]) continue

      const info = infoPage.imageinfo[0]
      const filename = infoPage.title

      // Skip if no URL
      if (!info.url) continue

      // Determine if this should be the primary image
      const isPrimary = !isPrimarySet && isPrimaryImageCandidate(filename)
      if (isPrimary) isPrimarySet = true

      images.push({
        filename,
        url: info.url,
        thumbUrl: info.thumburl || info.url,
        width: info.width,
        height: info.height,
        license: info.extmetadata?.LicenseShortName?.value,
        caption: cleanCaption(info.extmetadata?.ImageDescription?.value),
        isPrimary,
      })

      if (images.length >= maxImages) break
    }

    // If no primary was set, mark the first image as primary
    if (!isPrimarySet && images.length > 0) {
      images[0].isPrimary = true
    }

    console.log(`  [Wikipedia] Extracted ${images.length} images`)
    return images
  } catch (error) {
    console.warn(`[Wikipedia] Image extraction failed:`, error)
    return images
  }
}

// =====================================================
// Helper Functions
// =====================================================

/**
 * Check if an image filename is relevant (not an icon, flag, or logo)
 */
function isRelevantImage(filename: string): boolean {
  const lower = filename.toLowerCase()

  // Exclude common non-game images
  const excludePatterns = [
    'flag of',
    'icon',
    'logo',
    'symbol',
    'commons-logo',
    'wiki',
    'edit-clear',
    'ambox',
    'padlock',
    'question_book',
    'text_document',
    'crystal_clear',
    'nuvola',
    'gnome-',
    'gtk-',
    'emblem-',
    'disambig',
    'wiktionary',
    'wikiquote',
    'wikisource',
    'stub',
    '.svg', // Most SVGs are icons
    'pictogram',
    'p_',
    'button',
    'arrow',
    'portal',
  ]

  for (const pattern of excludePatterns) {
    if (lower.includes(pattern)) {
      return false
    }
  }

  // Prefer images with game-related names
  return true
}

/**
 * Check if an image is likely the primary/cover image
 */
function isPrimaryImageCandidate(filename: string): boolean {
  const lower = filename.toLowerCase()

  // Prefer box art, cover, or game-named images
  const primaryIndicators = [
    'box',
    'cover',
    'packaging',
    'game_box',
    'board_game',
    'boardgame',
    '_game.',
    'edition',
  ]

  for (const indicator of primaryIndicators) {
    if (lower.includes(indicator)) {
      return true
    }
  }

  // If it's a JPG/PNG with the game name, it's likely the cover
  if (lower.endsWith('.jpg') || lower.endsWith('.png')) {
    return true
  }

  return false
}

/**
 * Clean HTML from image caption
 */
function cleanCaption(caption?: string): string | undefined {
  if (!caption) return undefined

  return caption
    .replace(/<[^>]+>/g, '') // Remove HTML tags
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim()
    .slice(0, 500) // Limit length
}

/**
 * Get the primary image from a list of images
 */
export function getPrimaryImage(images: WikipediaImage[]): WikipediaImage | null {
  if (images.length === 0) return null

  const primary = images.find((img) => img.isPrimary)
  return primary || images[0]
}
