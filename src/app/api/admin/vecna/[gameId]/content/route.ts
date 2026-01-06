import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'

const ALLOWED_FIELDS = ['rules_content', 'setup_content', 'reference_content'] as const
type ContentField = (typeof ALLOWED_FIELDS)[number]

/**
 * PATCH /api/admin/vecna/[gameId]/content
 * Update a content field (rules_content, setup_content, or reference_content) for a game
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ gameId: string }> }
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { gameId } = await params
    const body = await request.json()
    const { field, value } = body as {
      field?: string
      value?: unknown
    }

    // Validate field name
    if (!field || !ALLOWED_FIELDS.includes(field as ContentField)) {
      return NextResponse.json(
        { error: `Invalid field. Allowed: ${ALLOWED_FIELDS.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate value is an object (JSON content)
    if (value === undefined || value === null || typeof value !== 'object') {
      return NextResponse.json(
        { error: 'Value must be a valid JSON object' },
        { status: 400 }
      )
    }

    const supabase = createAdminClient()

    // Update the specified content field
    const { data: game, error } = await supabase
      .from('games')
      .update({
        [field]: value,
        updated_at: new Date().toISOString(),
      })
      .eq('id', gameId)
      .select('id, name')
      .single()

    if (error) {
      console.error('Failed to update content:', error)
      return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
    }

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      gameId: game.id,
      name: game.name,
      field,
    })
  } catch (error) {
    console.error('Content update error:', error)
    return NextResponse.json({ error: 'Failed to update content' }, { status: 500 })
  }
}
