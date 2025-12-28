import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { validateImageFile, generateSecureFilename } from '@/lib/upload/validation'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// Upload a publisher logo
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.FILE_UPLOAD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const publisherId = formData.get('publisherId') as string
    const publisherSlug = formData.get('publisherSlug') as string

    if (!file || !publisherId || !publisherSlug) {
      return ApiErrors.validation('Missing required fields')
    }

    // Convert file to buffer first for validation
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate file with magic byte check (SVG not allowed - security risk)
    const validation = validateImageFile(buffer, file.type)
    if (!validation.valid) {
      return ApiErrors.validation(validation.error || 'Invalid file')
    }

    const adminClient = createAdminClient()

    // Generate secure filename using detected type
    const fileName = generateSecureFilename(publisherSlug, validation.detectedType!)

    // First, get old logo to delete if exists
    const { data: existingPublisher } = await adminClient
      .from('publishers')
      .select('logo_url')
      .eq('id', publisherId)
      .single()

    // Upload to storage using detected content type
    const { error: uploadError } = await adminClient.storage
      .from('publisher-logos')
      .upload(fileName, buffer, {
        contentType: validation.detectedType!,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return ApiErrors.upload(uploadError, { route: 'POST /api/admin/publisher-logo' })
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('publisher-logos')
      .getPublicUrl(fileName)

    // Update publisher record with new logo URL
    const { error: updateError } = await adminClient
      .from('publishers')
      .update({
        logo_url: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', publisherId)

    if (updateError) {
      // Clean up uploaded file on failure
      await adminClient.storage.from('publisher-logos').remove([fileName])
      return ApiErrors.database(updateError, { route: 'POST /api/admin/publisher-logo' })
    }

    // Delete old logo from storage if it existed
    if (existingPublisher?.logo_url) {
      const oldPath = extractStoragePath(existingPublisher.logo_url)
      if (oldPath) {
        await adminClient.storage.from('publisher-logos').remove([oldPath])
      }
    }

    return NextResponse.json({
      url: publicUrl,
      storagePath: fileName
    })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/publisher-logo' })
  }
}

// Delete a publisher logo
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { publisherId, storagePath } = await request.json()

    if (!publisherId) {
      return ApiErrors.validation('Missing publisherId')
    }

    const adminClient = createAdminClient()

    // Get current logo URL to extract path if not provided
    let pathToDelete = storagePath
    if (!pathToDelete) {
      const { data: publisher } = await adminClient
        .from('publishers')
        .select('logo_url')
        .eq('id', publisherId)
        .single()

      if (publisher?.logo_url) {
        pathToDelete = extractStoragePath(publisher.logo_url)
      }
    }

    // Delete from storage
    if (pathToDelete) {
      await adminClient.storage.from('publisher-logos').remove([pathToDelete])
    }

    // Clear logo_url in database
    const { error } = await adminClient
      .from('publishers')
      .update({
        logo_url: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', publisherId)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/admin/publisher-logo' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/publisher-logo' })
  }
}

// Helper to extract storage path from public URL
function extractStoragePath(publicUrl: string): string | null {
  try {
    // URL format: https://xxx.supabase.co/storage/v1/object/public/publisher-logos/slug/filename.ext
    const match = publicUrl.match(/publisher-logos\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
