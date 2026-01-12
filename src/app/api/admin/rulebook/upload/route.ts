import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// Allow up to 120 seconds for large file uploads
export const maxDuration = 120

// PDF magic bytes
const PDF_MAGIC_BYTES = [0x25, 0x50, 0x44, 0x46] // %PDF

function validatePdfFile(buffer: Buffer): { valid: boolean; error?: string } {
  // Check magic bytes
  const magicBytes = buffer.slice(0, 4)
  const isPdf = PDF_MAGIC_BYTES.every((byte, i) => magicBytes[i] === byte)

  if (!isPdf) {
    return { valid: false, error: 'File is not a valid PDF' }
  }

  // Check file size (max 50MB for rulebooks)
  const maxSize = 50 * 1024 * 1024
  if (buffer.length > maxSize) {
    return { valid: false, error: 'File size exceeds 50MB limit' }
  }

  return { valid: true }
}

/**
 * POST /api/admin/rulebook/upload
 * Upload a rulebook PDF to Supabase storage
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

    // Convert file to buffer for validation
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate PDF
    const validation = validatePdfFile(buffer)
    if (!validation.valid) {
      return ApiErrors.validation(validation.error || 'Invalid PDF file')
    }

    const adminClient = createAdminClient()

    // Generate filename: {game-slug}.pdf (bucket is already 'rulebooks')
    const storagePath = `${gameSlug}.pdf`

    // Upload to rulebooks bucket (upsert to replace existing)
    const { error: uploadError } = await adminClient.storage
      .from('rulebooks')
      .upload(storagePath, buffer, {
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

    // Update game record with the rulebook URL
    const { error: updateError } = await adminClient
      .from('games')
      .update({
        rulebook_url: publicUrl,
        rulebook_source: 'user_submitted',
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
      fileSize: buffer.length,
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
