import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'
import { validateImageFile, getExtensionForMimeType } from '@/lib/upload/validation'
import { randomBytes } from 'crypto'
import { ApiErrors } from '@/lib/api/errors'

// Create admin client with service role for storage operations
function createAdminClient() {
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// Get authenticated user
async function getUser() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

// Upload a profile image (header or avatar)
export async function POST(request: NextRequest) {
  const user = await getUser()
  if (!user) {
    return ApiErrors.unauthorized()
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const imageType = formData.get('imageType') as 'header' | 'avatar'

    if (!file || !imageType) {
      return ApiErrors.validation('Missing required fields')
    }

    if (!['header', 'avatar'].includes(imageType)) {
      return ApiErrors.validation('Invalid image type')
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

    // Generate secure filename: {userId}/{imageType}/{timestamp}-{random}.{ext}
    const ext = getExtensionForMimeType(validation.detectedType!)
    const randomPart = randomBytes(8).toString('hex')
    const fileName = `${user.id}/${imageType}/${Date.now()}-${randomPart}.${ext}`

    // Get current image URL to delete old file
    const dbColumn = imageType === 'header' ? 'header_image_url' : 'custom_avatar_url'
    const { data: existingProfile } = await adminClient
      .from('user_profiles')
      .select(dbColumn)
      .eq('id', user.id)
      .single()

    // Upload to storage using detected content type
    const { error: uploadError } = await adminClient.storage
      .from('user-profiles')
      .upload(fileName, buffer, {
        contentType: validation.detectedType!,
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      return ApiErrors.upload(uploadError, { route: 'POST /api/user/profile-image', userId: user.id })
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('user-profiles')
      .getPublicUrl(fileName)

    // Update profile with new image URL
    const { error: updateError } = await adminClient
      .from('user_profiles')
      .update({
        [dbColumn]: publicUrl,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (updateError) {
      // Clean up uploaded file on failure
      await adminClient.storage.from('user-profiles').remove([fileName])
      return ApiErrors.database(updateError, { route: 'POST /api/user/profile-image', userId: user.id })
    }

    // Delete old image from storage if it existed
    const oldUrl = existingProfile?.[dbColumn as keyof typeof existingProfile]
    if (oldUrl && typeof oldUrl === 'string') {
      const oldPath = extractStoragePath(oldUrl)
      if (oldPath) {
        await adminClient.storage.from('user-profiles').remove([oldPath])
      }
    }

    return NextResponse.json({
      url: publicUrl,
      imageType
    })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/user/profile-image' })
  }
}

// Delete a profile image
export async function DELETE(request: NextRequest) {
  const user = await getUser()
  if (!user) {
    return ApiErrors.unauthorized()
  }

  try {
    const { imageType } = await request.json()

    if (!imageType || !['header', 'avatar'].includes(imageType)) {
      return ApiErrors.validation('Invalid image type')
    }

    const adminClient = createAdminClient()
    const dbColumn = imageType === 'header' ? 'header_image_url' : 'custom_avatar_url'

    // Get current image URL
    const { data: profile } = await adminClient
      .from('user_profiles')
      .select(dbColumn)
      .eq('id', user.id)
      .single()

    const currentUrl = profile?.[dbColumn as keyof typeof profile]

    // Delete from storage
    if (currentUrl && typeof currentUrl === 'string') {
      const path = extractStoragePath(currentUrl)
      if (path) {
        await adminClient.storage.from('user-profiles').remove([path])
      }
    }

    // Clear URL in database
    const { error } = await adminClient
      .from('user_profiles')
      .update({
        [dbColumn]: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/user/profile-image', userId: user.id })
    }

    return NextResponse.json({ success: true, imageType })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/user/profile-image' })
  }
}

// Helper to extract storage path from public URL
function extractStoragePath(publicUrl: string): string | null {
  try {
    // URL format: https://xxx.supabase.co/storage/v1/object/public/user-profiles/userId/type/filename.ext
    const match = publicUrl.match(/user-profiles\/(.+)$/)
    return match ? match[1] : null
  } catch {
    return null
  }
}
