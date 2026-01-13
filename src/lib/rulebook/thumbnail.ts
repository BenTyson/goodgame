/**
 * Rulebook Thumbnail Generator
 * Generates PNG thumbnails from PDF rulebook first pages
 */

import { renderPageAsImage } from 'unpdf'
import { createCanvas, loadImage } from '@napi-rs/canvas'
import { createAdminClient } from '@/lib/supabase/admin'

// Thumbnail settings
const THUMBNAIL_SCALE = 1.5  // Scale factor for better quality
const THUMBNAIL_WIDTH = 400  // Width in pixels

/**
 * Add white background to an image buffer
 * PDF rendering produces transparent backgrounds, which look washed out
 */
async function addWhiteBackground(imageBuffer: ArrayBuffer): Promise<Buffer> {
  // Load the rendered PDF image
  const image = await loadImage(Buffer.from(imageBuffer))

  // Create a new canvas with white background
  const canvas = createCanvas(image.width, image.height)
  const ctx = canvas.getContext('2d')

  // Fill with white background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, image.width, image.height)

  // Draw the PDF image on top
  ctx.drawImage(image, 0, 0)

  // Export as PNG
  return canvas.toBuffer('image/png')
}

interface ThumbnailResult {
  thumbnailUrl: string
  storagePath: string
}

/**
 * Generate a thumbnail from the first page of a PDF
 * @param pdfUrl - URL to the PDF file
 * @param gameSlug - Game slug for filename
 * @returns Thumbnail URL and storage path, or null on failure
 */
export async function generateRulebookThumbnail(
  pdfUrl: string,
  gameSlug: string
): Promise<ThumbnailResult | null> {
  try {
    console.log(`[Thumbnail] Starting generation for ${gameSlug} from ${pdfUrl}`)

    // Fetch the PDF
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BoardNomads/1.0)',
      },
    })

    if (!response.ok) {
      console.error(`[Thumbnail] Failed to fetch PDF: ${response.status} ${response.statusText}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const pdfData = new Uint8Array(arrayBuffer)

    // Render the first page as an image
    // Returns ArrayBuffer containing PNG data
    // Note: canvasImport is required for Node.js environments
    const rawImageBuffer = await renderPageAsImage(pdfData, 1, {
      scale: THUMBNAIL_SCALE,
      width: THUMBNAIL_WIDTH,
      canvasImport: () => import('@napi-rs/canvas'),
    })

    console.log(`[Thumbnail] Rendered page 1, size: ${rawImageBuffer.byteLength} bytes`)

    // Add white background (PDF renders with transparent background)
    const imageBuffer = await addWhiteBackground(rawImageBuffer)
    console.log(`[Thumbnail] Added white background, final size: ${imageBuffer.byteLength} bytes`)

    // Upload to Supabase storage
    const adminClient = createAdminClient()
    const storagePath = `rulebook-thumbnails/${gameSlug}.png`

    const { error: uploadError } = await adminClient.storage
      .from('game-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000',  // 1 year cache
        upsert: true,  // Replace existing thumbnail
      })

    if (uploadError) {
      console.error(`[Thumbnail] Upload error:`, uploadError)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('game-images')
      .getPublicUrl(storagePath)

    console.log(`[Thumbnail] Successfully generated thumbnail: ${publicUrl}`)

    return {
      thumbnailUrl: publicUrl,
      storagePath,
    }
  } catch (error) {
    console.error(`[Thumbnail] Error generating thumbnail for ${gameSlug}:`, error)
    return null
  }
}

/**
 * Generate a thumbnail from the first page of a game document PDF
 * @param pdfUrl - URL to the PDF file
 * @param documentId - Document ID for filename
 * @returns Thumbnail URL and storage path, or null on failure
 */
export async function generateDocumentThumbnail(
  pdfUrl: string,
  documentId: string
): Promise<ThumbnailResult | null> {
  try {
    console.log(`[Thumbnail] Starting document thumbnail generation for ${documentId}`)

    // Fetch the PDF
    const response = await fetch(pdfUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; BoardNomads/1.0)',
      },
    })

    if (!response.ok) {
      console.error(`[Thumbnail] Failed to fetch PDF: ${response.status} ${response.statusText}`)
      return null
    }

    const arrayBuffer = await response.arrayBuffer()
    const pdfData = new Uint8Array(arrayBuffer)

    // Render the first page as an image
    const rawImageBuffer = await renderPageAsImage(pdfData, 1, {
      scale: THUMBNAIL_SCALE,
      width: THUMBNAIL_WIDTH,
      canvasImport: () => import('@napi-rs/canvas'),
    })

    console.log(`[Thumbnail] Rendered page 1, size: ${rawImageBuffer.byteLength} bytes`)

    // Add white background (PDF renders with transparent background)
    const imageBuffer = await addWhiteBackground(rawImageBuffer)
    console.log(`[Thumbnail] Added white background, final size: ${imageBuffer.byteLength} bytes`)

    // Upload to Supabase storage
    const adminClient = createAdminClient()
    const storagePath = `document-thumbnails/${documentId}.png`

    const { error: uploadError } = await adminClient.storage
      .from('game-images')
      .upload(storagePath, imageBuffer, {
        contentType: 'image/png',
        cacheControl: '31536000',  // 1 year cache
        upsert: true,
      })

    if (uploadError) {
      console.error(`[Thumbnail] Upload error:`, uploadError)
      return null
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('game-images')
      .getPublicUrl(storagePath)

    console.log(`[Thumbnail] Successfully generated document thumbnail: ${publicUrl}`)

    return {
      thumbnailUrl: publicUrl,
      storagePath,
    }
  } catch (error) {
    console.error(`[Thumbnail] Error generating document thumbnail for ${documentId}:`, error)
    return null
  }
}

/**
 * Delete a document thumbnail from storage
 * @param documentId - Document ID to identify the thumbnail
 */
export async function deleteDocumentThumbnail(documentId: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    const storagePath = `document-thumbnails/${documentId}.png`

    const { error } = await adminClient.storage
      .from('game-images')
      .remove([storagePath])

    if (error) {
      console.error(`[Thumbnail] Delete error:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`[Thumbnail] Error deleting document thumbnail for ${documentId}:`, error)
    return false
  }
}

/**
 * Delete a rulebook thumbnail from storage
 * @param gameSlug - Game slug to identify the thumbnail
 */
export async function deleteRulebookThumbnail(gameSlug: string): Promise<boolean> {
  try {
    const adminClient = createAdminClient()
    const storagePath = `rulebook-thumbnails/${gameSlug}.png`

    const { error } = await adminClient.storage
      .from('game-images')
      .remove([storagePath])

    if (error) {
      console.error(`[Thumbnail] Delete error:`, error)
      return false
    }

    return true
  } catch (error) {
    console.error(`[Thumbnail] Error deleting thumbnail for ${gameSlug}:`, error)
    return false
  }
}
