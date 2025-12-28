import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { validateImageFile, generateSecureFilename } from '@/lib/upload/validation'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

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
      return ApiErrors.validation('Missing required fields')
    }

    // Convert file to buffer first for validation
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate file with magic byte check
    const validation = validateImageFile(buffer, file.type)
    if (!validation.valid) {
      return ApiErrors.validation(validation.error || 'Invalid file')
    }

    const adminClient = createAdminClient()

    // Generate secure filename using detected type (not user-provided extension)
    const fileName = generateSecureFilename(gameSlug, validation.detectedType!)

    // Upload to storage using detected content type
    const { error: uploadError } = await adminClient.storage
      .from('game-images')
      .upload(fileName, buffer, {
        contentType: validation.detectedType!,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return ApiErrors.upload(uploadError, { route: 'POST /api/admin/upload' })
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('game-images')
      .getPublicUrl(fileName)

    // Check how many images exist for this game
    const { count } = await adminClient
      .from('game_images')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)

    const isPrimary = count === 0

    // Create database record
    const { data: imageRecord, error: dbError } = await adminClient
      .from('game_images')
      .insert({
        game_id: gameId,
        url: publicUrl,
        storage_path: fileName,
        image_type: 'gallery',
        is_primary: isPrimary,
        display_order: count || 0,
        file_size: file.size
      })
      .select()
      .single()

    if (dbError) {
      // Try to clean up uploaded file
      await adminClient.storage.from('game-images').remove([fileName])
      return ApiErrors.database(dbError, { route: 'POST /api/admin/upload' })
    }

    // If this is the first/primary image, sync to games table
    if (isPrimary) {
      await adminClient
        .from('games')
        .update({
          box_image_url: publicUrl,
          hero_image_url: publicUrl,
          thumbnail_url: publicUrl,
        })
        .eq('id', gameId)
    }

    return NextResponse.json({ image: imageRecord })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/upload' })
  }
}

// Set primary image and sync to games table
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  // Check admin auth
  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { gameId, imageId, imageUrl } = await request.json()

    if (!gameId || !imageId || !imageUrl) {
      return ApiErrors.validation('Missing required fields')
    }

    const adminClient = createAdminClient()

    // Clear all primary flags for this game
    await adminClient
      .from('game_images')
      .update({ is_primary: false })
      .eq('game_id', gameId)

    // Set the new primary
    await adminClient
      .from('game_images')
      .update({ is_primary: true })
      .eq('id', imageId)

    // Sync to games table
    const { error: gameError } = await adminClient
      .from('games')
      .update({
        box_image_url: imageUrl,
        hero_image_url: imageUrl,
        thumbnail_url: imageUrl,
      })
      .eq('id', gameId)

    if (gameError) {
      return ApiErrors.database(gameError, { route: 'PATCH /api/admin/upload' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/upload' })
  }
}

export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  // Check admin auth
  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { imageId, storagePath } = await request.json()

    if (!imageId) {
      return ApiErrors.validation('Missing imageId')
    }

    const adminClient = createAdminClient()

    // Delete from storage if path provided
    if (storagePath) {
      await adminClient.storage.from('game-images').remove([storagePath])
    }

    // Delete from database
    const { error } = await adminClient
      .from('game_images')
      .delete()
      .eq('id', imageId)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/admin/upload' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/upload' })
  }
}
