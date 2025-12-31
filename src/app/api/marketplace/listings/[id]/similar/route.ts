/**
 * Similar Listings API
 *
 * GET - Get similar listings for a listing
 */

import { NextRequest, NextResponse } from 'next/server'
import { getSimilarListings } from '@/lib/supabase/discovery-queries'
import type { SimilarListingsResponse } from '@/types/marketplace'
import { SIMILAR_LISTINGS_SETTINGS } from '@/lib/config/marketplace-constants'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET - Get similar listings for a listing
 * Query params:
 * - limit: Number of similar listings to return (default 6)
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const limit = parseInt(
      searchParams.get('limit') || String(SIMILAR_LISTINGS_SETTINGS.DEFAULT_LIMIT),
      10
    )

    const listings = await getSimilarListings(id, limit)

    return NextResponse.json<SimilarListingsResponse>({ listings })
  } catch (error) {
    console.error('Error fetching similar listings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch similar listings' },
      { status: 500 }
    )
  }
}
