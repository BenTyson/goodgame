import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

// POST - Add a new video
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const body = await request.json()
    const { gameId, youtubeUrl, youtubeVideoId, videoType, title, displayOrder, isFeatured } = body

    if (!gameId || !youtubeUrl || !youtubeVideoId || !videoType) {
      return ApiErrors.validation('Missing required fields')
    }

    const validTypes = ['overview', 'gameplay', 'review']
    if (!validTypes.includes(videoType)) {
      return ApiErrors.validation(`Invalid video type. Must be one of: ${validTypes.join(', ')}`)
    }

    const adminClient = createAdminClient()

    // If this is featured, clear other featured videos for this game
    if (isFeatured) {
      await adminClient
        .from('game_videos')
        .update({ is_featured: false })
        .eq('game_id', gameId)
    }

    // Insert the video
    const { data: video, error } = await adminClient
      .from('game_videos')
      .insert({
        game_id: gameId,
        youtube_url: youtubeUrl,
        youtube_video_id: youtubeVideoId,
        video_type: videoType,
        title: title || null,
        display_order: displayOrder || 0,
        is_featured: isFeatured || false,
      })
      .select()
      .single()

    if (error) {
      return ApiErrors.database(error, { route: 'POST /api/admin/game-videos' })
    }

    return NextResponse.json({ video })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/game-videos' })
  }
}

// PATCH - Update video (set featured, update title/type)
export async function PATCH(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const body = await request.json()
    const { videoId, gameId, isFeatured, title, videoType } = body

    if (!videoId) {
      return ApiErrors.validation('Missing videoId')
    }

    const adminClient = createAdminClient()

    // If setting as featured, clear other featured videos
    if (isFeatured && gameId) {
      await adminClient
        .from('game_videos')
        .update({ is_featured: false })
        .eq('game_id', gameId)
    }

    // Build update object
    const updateData: Record<string, unknown> = {}
    if (isFeatured !== undefined) updateData.is_featured = isFeatured
    if (title !== undefined) updateData.title = title
    if (videoType !== undefined) updateData.video_type = videoType

    const { error } = await adminClient
      .from('game_videos')
      .update(updateData)
      .eq('id', videoId)

    if (error) {
      return ApiErrors.database(error, { route: 'PATCH /api/admin/game-videos' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'PATCH /api/admin/game-videos' })
  }
}

// DELETE - Remove a video
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const body = await request.json()
    const { videoId } = body

    if (!videoId) {
      return ApiErrors.validation('Missing videoId')
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('game_videos')
      .delete()
      .eq('id', videoId)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/admin/game-videos' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/game-videos' })
  }
}
