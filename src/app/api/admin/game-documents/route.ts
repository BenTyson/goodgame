import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { validatePdfFile, generateSecurePdfFilename } from '@/lib/upload/validation'
import { generateDocumentThumbnail, deleteDocumentThumbnail } from '@/lib/rulebook/thumbnail'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'
import type { DocumentType } from '@/types/database'

// Route segment config for file uploads
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 120 // 120 seconds for large uploads

const VALID_DOCUMENT_TYPES: DocumentType[] = [
  'gameplay_guide',
  'glossary',
  'icon_overview',
  'setup_guide',
  'faq',
  'misc',
]

// GET - List documents for a game
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { searchParams } = new URL(request.url)
    const gameId = searchParams.get('gameId')

    if (!gameId) {
      return ApiErrors.validation('Missing gameId')
    }

    const adminClient = createAdminClient()

    const { data: documents, error } = await adminClient
      .from('game_documents')
      .select('*')
      .eq('game_id', gameId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      return ApiErrors.database(error, { route: 'GET /api/admin/game-documents' })
    }

    return NextResponse.json({ documents: documents || [] })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'GET /api/admin/game-documents' })
  }
}

// POST - Upload a new document
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.FILE_UPLOAD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  let formData: FormData
  try {
    formData = await request.formData()
  } catch (parseError) {
    console.error('FormData parse error:', parseError)
    return NextResponse.json(
      { error: 'Failed to parse upload data. Please try again.' },
      { status: 400 }
    )
  }

  try {
    const file = formData.get('file') as File
    const gameId = formData.get('gameId') as string
    const gameSlug = formData.get('gameSlug') as string
    const documentType = formData.get('documentType') as DocumentType
    const title = (formData.get('title') as string) || file?.name?.replace('.pdf', '') || 'Untitled'

    // Validate required fields
    if (!file || !gameId || !gameSlug || !documentType) {
      return ApiErrors.validation('Missing required fields: file, gameId, gameSlug, documentType')
    }

    // Validate document type
    if (!VALID_DOCUMENT_TYPES.includes(documentType)) {
      return ApiErrors.validation(`Invalid documentType. Must be one of: ${VALID_DOCUMENT_TYPES.join(', ')}`)
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Validate PDF
    const validation = validatePdfFile(buffer)
    if (!validation.valid) {
      return ApiErrors.validation(validation.error || 'Invalid file')
    }

    const adminClient = createAdminClient()

    // Generate secure filename
    const storagePath = generateSecurePdfFilename(gameSlug, documentType)

    // Upload to storage (reuse rulebooks bucket)
    const { error: uploadError } = await adminClient.storage
      .from('rulebooks')
      .upload(storagePath, buffer, {
        contentType: 'application/pdf',
        cacheControl: '31536000', // 1 year cache
        upsert: false,
      })

    if (uploadError) {
      console.error('Storage upload error:', uploadError)
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: { publicUrl } } = adminClient.storage
      .from('rulebooks')
      .getPublicUrl(storagePath)

    // Get current user for uploaded_by (use server client, not admin client)
    const serverClient = await createServerClient()
    const { data: { user } } = await serverClient.auth.getUser()

    // Check current document count for display_order
    const { count } = await adminClient
      .from('game_documents')
      .select('*', { count: 'exact', head: true })
      .eq('game_id', gameId)

    // Create database record
    const { data: document, error: dbError } = await adminClient
      .from('game_documents')
      .insert({
        game_id: gameId,
        document_type: documentType,
        title: title.slice(0, 255),
        url: publicUrl,
        storage_path: storagePath,
        file_size: file.size,
        display_order: count || 0,
        uploaded_by: user?.id || null,
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database insert error:', dbError)
      // Clean up uploaded file
      await adminClient.storage.from('rulebooks').remove([storagePath])
      return NextResponse.json(
        { error: `Database error: ${dbError.message}` },
        { status: 500 }
      )
    }

    // Generate thumbnail (non-blocking - don't fail upload if this fails)
    let updatedDocument = document
    try {
      const thumbnailResult = await generateDocumentThumbnail(publicUrl, document.id)
      if (thumbnailResult) {
        // Update document record with thumbnail URL
        const { data: docWithThumbnail } = await adminClient
          .from('game_documents')
          .update({ thumbnail_url: thumbnailResult.thumbnailUrl })
          .eq('id', document.id)
          .select()
          .single()

        if (docWithThumbnail) {
          updatedDocument = docWithThumbnail
        }
      }
    } catch (thumbnailError) {
      console.error('Thumbnail generation failed (non-fatal):', thumbnailError)
    }

    return NextResponse.json({ document: updatedDocument })
  } catch (error) {
    console.error('Unexpected error in game-documents POST:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// DELETE - Remove a document
export async function DELETE(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { documentId, storagePath } = await request.json()

    if (!documentId) {
      return ApiErrors.validation('Missing documentId')
    }

    const adminClient = createAdminClient()

    // Delete from storage if path provided
    if (storagePath) {
      const { error: storageError } = await adminClient.storage
        .from('rulebooks')
        .remove([storagePath])

      if (storageError) {
        console.warn('Failed to delete from storage:', storageError)
        // Continue with database deletion even if storage fails
      }
    }

    // Delete thumbnail (non-fatal if fails)
    await deleteDocumentThumbnail(documentId)

    // Delete from database
    const { error } = await adminClient
      .from('game_documents')
      .delete()
      .eq('id', documentId)

    if (error) {
      return ApiErrors.database(error, { route: 'DELETE /api/admin/game-documents' })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'DELETE /api/admin/game-documents' })
  }
}
