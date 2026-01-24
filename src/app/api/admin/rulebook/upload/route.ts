import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// Allow up to 120 seconds for large file uploads
export const maxDuration = 120

// PDF magic bytes: %PDF
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46]
const MAX_FILE_SIZE = 50 * 1024 * 1024 // 50MB

/**
 * Validate PDF by checking magic bytes from first 4 bytes of file
 * Memory-efficient: only reads 4 bytes, not the entire file
 */
async function validatePdfMagicBytes(file: File): Promise<{ valid: boolean; error?: string }> {
  // Check file size first (no memory needed - uses File.size property)
  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds 50MB limit' }
  }

  // Read only the first 4 bytes to check magic bytes
  const headerBlob = file.slice(0, 4)
  const headerBuffer = await headerBlob.arrayBuffer()
  const headerBytes = new Uint8Array(headerBuffer)

  const isPdf = PDF_MAGIC_BYTES.every((byte, i) => headerBytes[i] === byte)
  if (!isPdf) {
    return { valid: false, error: 'File is not a valid PDF' }
  }

  return { valid: true }
}

/**
 * POST /api/admin/rulebook/upload
 * Upload a rulebook PDF to Supabase storage
 *
 * Memory-optimized: validates with minimal reads, then streams file to storage
 */
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.FILE_UPLOAD)
  if (rateLimited) return rateLimited

  // Check admin auth
  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const gameId = formData.get('gameId') as string
    const gameSlug = formData.get('gameSlug') as string

    if (!file || !gameId || !gameSlug) {
      return ApiErrors.validation('Missing required fields: file, gameId, gameSlug')
    }

    // Validate PDF (memory-efficient - only reads 4 bytes)
    const validation = await validatePdfMagicBytes(file)
    if (!validation.valid) {
      return ApiErrors.validation(validation.error || 'Invalid PDF file')
    }

    const adminClient = createAdminClient()

    // Generate filename: {game-slug}.pdf (bucket is already 'rulebooks')
    const storagePath = `${gameSlug}.pdf`

    // Read file once for upload (avoid double buffering)
    const arrayBuffer = await file.arrayBuffer()

    // Upload to rulebooks bucket (upsert to replace existing)
    // Use Uint8Array which is more memory-efficient than Buffer.from() copy
    const { error: uploadError } = await adminClient.storage
      .from('rulebooks')
      .upload(storagePath, new Uint8Array(arrayBuffer), {
        contentType: 'application/pdf',
        cacheControl: '31536000', // 1 year cache
        upsert: true,
      })

    if (uploadError) {
      console.error('Rulebook upload error:', uploadError)
      return ApiErrors.upload(uploadError, { route: 'POST /api/admin/rulebook/upload' })
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('rulebooks')
      .getPublicUrl(storagePath)

    // Update game record with the rulebook URL and reset state
    const { error: updateError } = await adminClient
      .from('games')
      .update({
        rulebook_url: publicUrl,
        rulebook_source: 'user_submitted',
        vecna_state: 'rulebook_ready',
        vecna_error: null,
        vecna_processed_at: new Date().toISOString(),
      })
      .eq('id', gameId)

    if (updateError) {
      console.error('Failed to update game with rulebook URL:', updateError)
      // Don't fail - the file is uploaded, just log the error
    }

    return NextResponse.json({
      success: true,
      url: publicUrl,
      storagePath,
      fileSize: file.size,
    })
  } catch (error) {
    console.error('Rulebook upload error:', error)
    const message = error instanceof Error ? error.message : 'Upload failed'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
