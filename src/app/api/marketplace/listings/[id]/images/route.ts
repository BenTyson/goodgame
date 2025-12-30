import { NextRequest, NextResponse } from 'next/server'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { validateImageFile, generateSecureFilename } from '@/lib/upload/validation'
import { getListingById } from '@/lib/supabase/listing-queries'
import type { ListingImage } from '@/types/marketplace'

interface RouteContext {
  params: Promise<{ id: string }>
}

const MAX_IMAGES_PER_LISTING = 6

/**
 * POST /api/marketplace/listings/[id]/images
 * Upload a new image for a listing
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: listingId } = await context.params
    const listing = await getListingById(listingId)

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Check image count limit
    const adminClient = createAdminClient()
    const { count } = await adminClient
      .from('listing_images')
      .select('*', { count: 'exact', head: true })
      .eq('listing_id', listingId)

    if ((count || 0) >= MAX_IMAGES_PER_LISTING) {
      return NextResponse.json(
        { error: `Maximum ${MAX_IMAGES_PER_LISTING} images per listing` },
        { status: 400 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Convert file to buffer for validation
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate image
    const validation = validateImageFile(buffer, file.type, {
      maxSizeBytes: 10 * 1024 * 1024, // 10MB for listing images
    })

    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    // Generate secure filename: {userId}/{listingId}/{timestamp}-{random}.{ext}
    const storagePath = `${user.id}/${listingId}/${generateSecureFilename('img', validation.detectedType!)}`

    // Upload to storage
    const { error: uploadError } = await adminClient.storage
      .from('listing-images')
      .upload(storagePath, buffer, {
        contentType: validation.detectedType,
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json({ error: 'Failed to upload image' }, { status: 500 })
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('listing-images')
      .getPublicUrl(storagePath)

    // Determine if this should be the primary image
    const isPrimary = (count || 0) === 0

    // Get next display order
    const { data: maxOrderData } = await adminClient
      .from('listing_images')
      .select('display_order')
      .eq('listing_id', listingId)
      .order('display_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = (maxOrderData?.display_order ?? -1) + 1

    // Insert into database
    const { data: image, error: dbError } = await adminClient
      .from('listing_images')
      .insert({
        listing_id: listingId,
        url: publicUrl,
        storage_path: storagePath,
        mime_type: validation.detectedType,
        file_size: buffer.length,
        display_order: nextOrder,
        is_primary: isPrimary,
      })
      .select()
      .single()

    if (dbError) {
      // Clean up uploaded file if DB insert fails
      await adminClient.storage.from('listing-images').remove([storagePath])
      console.error('Database insert error:', dbError)
      return NextResponse.json({ error: 'Failed to save image record' }, { status: 500 })
    }

    return NextResponse.json({ image })
  } catch (error) {
    console.error('Error in POST /api/marketplace/listings/[id]/images:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/marketplace/listings/[id]/images
 * Update image (set primary, reorder)
 */
export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: listingId } = await context.params
    const listing = await getListingById(listingId)

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { imageId, setPrimary } = body

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    if (setPrimary) {
      // Clear existing primary
      await adminClient
        .from('listing_images')
        .update({ is_primary: false })
        .eq('listing_id', listingId)

      // Set new primary
      const { error } = await adminClient
        .from('listing_images')
        .update({ is_primary: true })
        .eq('id', imageId)
        .eq('listing_id', listingId)

      if (error) {
        return NextResponse.json({ error: 'Failed to update primary image' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in PATCH /api/marketplace/listings/[id]/images:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/marketplace/listings/[id]/images
 * Delete an image from a listing
 */
export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: listingId } = await context.params
    const listing = await getListingById(listingId)

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { imageId, storagePath } = body

    if (!imageId) {
      return NextResponse.json({ error: 'Image ID required' }, { status: 400 })
    }

    const adminClient = createAdminClient()

    // Get the image to check if it's primary
    const { data: imageData } = await adminClient
      .from('listing_images')
      .select('is_primary')
      .eq('id', imageId)
      .eq('listing_id', listingId)
      .single()

    // Delete from database
    const { error: dbError } = await adminClient
      .from('listing_images')
      .delete()
      .eq('id', imageId)
      .eq('listing_id', listingId)

    if (dbError) {
      console.error('Database delete error:', dbError)
      return NextResponse.json({ error: 'Failed to delete image' }, { status: 500 })
    }

    // Delete from storage if path provided
    if (storagePath) {
      await adminClient.storage.from('listing-images').remove([storagePath])
    }

    // If deleted image was primary, make first remaining image primary
    if (imageData?.is_primary) {
      const { data: remaining } = await adminClient
        .from('listing_images')
        .select('id')
        .eq('listing_id', listingId)
        .order('display_order', { ascending: true })
        .limit(1)

      if (remaining && remaining.length > 0) {
        await adminClient
          .from('listing_images')
          .update({ is_primary: true })
          .eq('id', remaining[0].id)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in DELETE /api/marketplace/listings/[id]/images:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/marketplace/listings/[id]/images
 * Get all images for a listing
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id: listingId } = await context.params

    const supabase = await createClient()

    const { data: images, error } = await supabase
      .from('listing_images')
      .select('*')
      .eq('listing_id', listingId)
      .order('display_order', { ascending: true })

    if (error) {
      console.error('Error fetching images:', error)
      return NextResponse.json({ error: 'Failed to fetch images' }, { status: 500 })
    }

    return NextResponse.json({ images: images as ListingImage[] })
  } catch (error) {
    console.error('Error in GET /api/marketplace/listings/[id]/images:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
