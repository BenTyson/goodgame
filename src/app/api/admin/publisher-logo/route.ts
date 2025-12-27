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

// Upload a publisher logo
export async function POST(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const publisherId = formData.get('publisherId') as string
    const publisherSlug = formData.get('publisherSlug') as string

    if (!file || !publisherId || !publisherSlug) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type. Allowed: JPEG, PNG, WebP, GIF, SVG' }, { status: 400 })
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      return NextResponse.json({ error: 'File too large (max 5MB)' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Generate unique filename
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${publisherSlug}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // First, get old logo to delete if exists
    const { data: existingPublisher } = await adminClient
      .from('publishers')
      .select('logo_url')
      .eq('id', publisherId)
      .single()

    // Upload to storage
    const { error: uploadError } = await adminClient.storage
      .from('publisher-logos')
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
      return NextResponse.json({ error: updateError.message }, { status: 500 })
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
  } catch {
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}

// Delete a publisher logo
export async function DELETE(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { publisherId, storagePath } = await request.json()

    if (!publisherId) {
      return NextResponse.json({ error: 'Missing publisherId' }, { status: 400 })
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
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
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
