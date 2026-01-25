import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

/**
 * POST /api/admin/rulebook/signed-url
 * Generate a signed URL for direct client-side upload to Supabase Storage
 *
 * This bypasses server memory limitations for large files by allowing
 * the client to upload directly to Supabase Storage.
 */
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.FILE_UPLOAD)
  if (rateLimited) return rateLimited

  // Check admin auth
  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { gameSlug } = await request.json()

    if (!gameSlug) {
      return ApiErrors.validation('Missing required field: gameSlug')
    }

    const adminClient = createAdminClient()
    const storagePath = `${gameSlug}.pdf`

    // Generate signed URL for upload (valid for 2 minutes)
    const { data, error } = await adminClient.storage
      .from('rulebooks')
      .createSignedUploadUrl(storagePath, {
        upsert: true,
      })

    if (error) {
      console.error('Failed to create signed upload URL:', error)
      return NextResponse.json(
        { error: 'Failed to create upload URL' },
        { status: 500 }
      )
    }

    // Get public URL for reference
    const { data: { publicUrl } } = adminClient.storage
      .from('rulebooks')
      .getPublicUrl(storagePath)

    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      path: data.path,
      publicUrl,
    })
  } catch (error) {
    console.error('Signed URL generation error:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate upload URL'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
