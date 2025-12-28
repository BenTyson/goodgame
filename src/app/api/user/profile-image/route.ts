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
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const imageType = formData.get('imageType') as 'header' | 'avatar'

    if (!file || !imageType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    if (!['header', 'avatar'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF' }, { status: 400 })
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Generate unique filename: {userId}/{imageType}/{timestamp}.{ext}
    const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const fileName = `${user.id}/${imageType}/${Date.now()}.${fileExt}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Get current image URL to delete old file
    const dbColumn = imageType === 'header' ? 'header_image_url' : 'custom_avatar_url'
    const { data: existingProfile } = await adminClient
      .from('user_profiles')
      .select(dbColumn)
      .eq('id', user.id)
      .single()

    // Upload to storage
    const { error: uploadError } = await adminClient.storage
      .from('user-profiles')
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
      return NextResponse.json({ error: updateError.message }, { status: 500 })
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
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// Delete a profile image
export async function DELETE(request: NextRequest) {
  const user = await getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { imageType } = await request.json()

    if (!imageType || !['header', 'avatar'].includes(imageType)) {
      return NextResponse.json({ error: 'Invalid image type' }, { status: 400 })
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, imageType })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
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
