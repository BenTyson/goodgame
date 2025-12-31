import { NextRequest, NextResponse } from 'next/server'
import { isAdmin } from '@/lib/supabase/admin'
import { validateRulebookUrl } from '@/lib/rulebook'

/**
 * POST /api/admin/rulebook/validate
 * Validate that a URL points to a valid PDF rulebook
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin auth
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const body = await request.json()
    const { url } = body

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL required' }, { status: 400 })
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      return NextResponse.json({
        valid: false,
        error: 'Invalid URL format',
      })
    }

    // Check if URL points to valid PDF
    const result = await validateRulebookUrl(url)

    return NextResponse.json(result)
  } catch (error) {
    console.error('Rulebook validation error:', error)
    return NextResponse.json(
      { valid: false, error: 'Validation failed' },
      { status: 500 }
    )
  }
}
