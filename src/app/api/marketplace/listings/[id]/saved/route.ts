import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { isListingSaved } from '@/lib/supabase/listing-queries'

interface RouteContext {
  params: Promise<{ id: string }>
}

/**
 * GET /api/marketplace/listings/[id]/saved
 * Check if a listing is saved by the current user
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ saved: false })
    }

    const { id } = await context.params
    const saved = await isListingSaved(user.id, id)

    return NextResponse.json({ saved })
  } catch (error) {
    console.error('Error in GET /api/marketplace/listings/[id]/saved:', error)
    return NextResponse.json({ saved: false })
  }
}
