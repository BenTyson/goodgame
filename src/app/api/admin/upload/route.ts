import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

// Create admin client with service role for storage operations
function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Verify user is admin
async function isAdmin(): Promise<boolean> {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user?.email) return false

  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  return adminEmails.includes(user.email.toLowerCase())
}

export async function POST(request: NextRequest) {
  // Check admin auth
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const gameId = formData.get('gameId') as string
    const gameSlug = formData.get('gameSlug') as string

    if (!file || !gameId || !gameSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${gameSlug}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to storage
    const { error: uploadError } = await adminClient.storage
      .from('game-images')
      .upload(fileName, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 500 })
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
      return NextResponse.json({ error: dbError.message }, { status: 500 })
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
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// Set primary image and sync to games table
export async function PATCH(request: NextRequest) {
  // Check admin auth
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { gameId, imageId, imageUrl } = await request.json()

    if (!gameId || !imageId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
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
      return NextResponse.json({ error: gameError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to set primary image' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  // Check admin auth
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { imageId, storagePath } = await request.json()

    if (!imageId) {
      return NextResponse.json({ error: 'Missing imageId' }, { status: 400 })
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}
