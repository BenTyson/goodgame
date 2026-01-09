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
    const imageType = (formData.get('imageType') as string) || 'gallery'

    // Attribution fields
    const source = formData.get('source') as string | null
    const sourceUrl = formData.get('source_url') as string | null
    const attribution = formData.get('attribution') as string | null
    const license = formData.get('license') as string | null

    // Validate imageType
    const validImageTypes = ['cover', 'hero', 'gallery']
    if (!validImageTypes.includes(imageType)) {
      return ApiErrors.validation(`Invalid imageType. Must be one of: ${validImageTypes.join(', ')}`)
    }

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

    // Cover images are primary by default if no other images exist
    const isPrimary = imageType === 'cover' && count === 0

    // Validate source if provided
    const validSources = ['publisher', 'wikimedia', 'bgg', 'user_upload', 'press_kit', 'promotional'] as const
    type ImageSource = typeof validSources[number]
    const validatedSource: ImageSource | null = source && validSources.includes(source as ImageSource)
      ? source as ImageSource
      : null

    // Create database record
    const { data: imageRecord, error: dbError } = await adminClient
      .from('game_images')
      .insert({
        game_id: gameId,
        url: publicUrl,
        storage_path: fileName,
        image_type: imageType,
        is_primary: isPrimary,
        display_order: count || 0,
        file_size: file.size,
        // Attribution fields
        source: validatedSource,
        source_url: sourceUrl || null,
        attribution: attribution || null,
        license: license || null,
      })
      .select()
      .single()

    if (dbError) {
      // Try to clean up uploaded file
      await adminClient.storage.from('game-images').remove([fileName])
      return ApiErrors.database(dbError, { route: 'POST /api/admin/upload' })
    }

    // Sync to games table based on image type
    if (imageType === 'cover') {
      // Cover images go to box_image_url and thumbnail_url
      const updateData: Record<string, string> = {
        box_image_url: publicUrl,
        thumbnail_url: publicUrl,
      }
      // If it's the first image, also set hero
      if (isPrimary) {
        updateData.hero_image_url = publicUrl
      }
      await adminClient
        .from('games')
        .update(updateData)
        .eq('id', gameId)
    } else if (imageType === 'hero') {
      // Hero images only update hero_image_url
      await adminClient
        .from('games')
        .update({ hero_image_url: publicUrl })
        .eq('id', gameId)
    }
    // Gallery images don't sync to games table

    return NextResponse.json({ image: imageRecord })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/upload' })
  }
}

// Set primary image OR update image metadata
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  // Check admin auth
  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const body = await request.json()
    const adminClient = createAdminClient()

    // Handle metadata update
    if (body.action === 'update_metadata') {
      const { imageId, source, source_url, attribution, license } = body

      if (!imageId) {
        return ApiErrors.validation('Missing imageId')
      }

      // Validate source if provided
      const validSources = ['publisher', 'wikimedia', 'bgg', 'user_upload', 'press_kit', 'promotional'] as const
      type ImageSourceType = typeof validSources[number]
      const validatedSource: ImageSourceType | null = source && validSources.includes(source)
        ? source as ImageSourceType
        : null

      const { error: updateError } = await adminClient
        .from('game_images')
        .update({
          source: validatedSource,
          source_url: source_url || null,
          attribution: attribution || null,
          license: license || null,
        })
        .eq('id', imageId)

      if (updateError) {
        return ApiErrors.database(updateError, { route: 'PATCH /api/admin/upload (metadata)' })
      }

      return NextResponse.json({ success: true })
    }

    // Handle set primary image (existing logic)
    const { gameId, imageId, imageUrl } = body

    if (!gameId || !imageId || !imageUrl) {
      return ApiErrors.validation('Missing required fields')
    }

    // Clear all primary flags for this game
    const { error: clearError } = await adminClient
      .from('game_images')
      .update({ is_primary: false })
      .eq('game_id', gameId)

    if (clearError) {
      console.error('Error clearing primary flags:', clearError)
    }

    // Set the new primary
    const { error: setPrimaryError } = await adminClient
      .from('game_images')
      .update({ is_primary: true })
      .eq('id', imageId)

    if (setPrimaryError) {
      console.error('Error setting primary:', setPrimaryError)
    }

    // Sync to games table
    const { data: updateData, error: gameError } = await adminClient
      .from('games')
      .update({
        box_image_url: imageUrl,
        hero_image_url: imageUrl,
        thumbnail_url: imageUrl,
      })
      .eq('id', gameId)
      .select('id, box_image_url')
      .single()

    if (gameError) {
      console.error('Error syncing to games table:', gameError, { gameId, imageUrl })
      return ApiErrors.database(gameError, { route: 'PATCH /api/admin/upload' })
    }

    console.log('Successfully synced primary image:', { gameId, imageUrl, updateData })

    return NextResponse.json({ success: true, synced: updateData })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/upload' })
  }
}

// Import external image (from Wikipedia/Wikidata)
export async function PUT(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  // Check admin auth
  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { gameId, url, source, license, isPrimary, imageType = 'cover' } = await request.json()

    if (!gameId || !url) {
      return ApiErrors.validation('Missing required fields: gameId and url')
    }

    // Validate imageType
    const validImageTypes = ['cover', 'hero', 'gallery']
    if (!validImageTypes.includes(imageType)) {
      return ApiErrors.validation(`Invalid imageType. Must be one of: ${validImageTypes.join(', ')}`)
    }

    // Validate source
    const validSources = ['wikipedia', 'wikidata', 'external']
    if (source && !validSources.includes(source)) {
      return ApiErrors.validation(`Invalid source. Must be one of: ${validSources.join(', ')}`)
    }

    const adminClient = createAdminClient()

    // Check how many images exist for this game
    const { count } = await adminClient
      .from('game_images')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)

    // Determine if this should be primary
    const shouldBePrimary = isPrimary || count === 0

    // If setting as primary, clear other primary flags first
    if (shouldBePrimary) {
      await adminClient
        .from('game_images')
        .update({ is_primary: false })
        .eq('game_id', gameId)
    }

    // Create database record (no storage_path for external images)
    const { data: imageRecord, error: dbError } = await adminClient
      .from('game_images')
      .insert({
        game_id: gameId,
        url: url,
        storage_path: null, // External image, not stored locally
        image_type: imageType,
        is_primary: shouldBePrimary,
        display_order: count || 0,
        alt_text: source ? `Image from ${source}` : null,
        caption: license ? `License: ${license}` : null,
      })
      .select()
      .single()

    if (dbError) {
      return ApiErrors.database(dbError, { route: 'PUT /api/admin/upload' })
    }

    // Sync to games table if primary
    if (shouldBePrimary) {
      await adminClient
        .from('games')
        .update({
          box_image_url: url,
          hero_image_url: url,
          thumbnail_url: url,
        })
        .eq('id', gameId)
    }

    return NextResponse.json({ image: imageRecord })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PUT /api/admin/upload' })
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
