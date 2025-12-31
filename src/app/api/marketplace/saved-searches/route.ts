/**
 * Saved Searches API
 *
 * GET - List user's saved searches
 * POST - Create a new saved search
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getUserSavedSearches,
  createSavedSearch,
  getSavedSearchCount,
  generateSavedSearchName,
} from '@/lib/supabase/discovery-queries'
import type { CreateSavedSearchRequest, SavedSearchResponse } from '@/types/marketplace'
import { SAVED_SEARCH_SETTINGS } from '@/lib/config/marketplace-constants'

/**
 * GET - List saved searches for current user
 * Query params:
 * - status: Filter by 'active', 'paused', or 'expired' (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status') as 'active' | 'paused' | 'expired' | null

    const savedSearches = await getUserSavedSearches(
      user.id,
      status || undefined
    )

    return NextResponse.json<SavedSearchResponse>({
      savedSearches,
      total: savedSearches.length,
    })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create a new saved search
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as CreateSavedSearchRequest
    const { name, filters, alert_frequency, alert_email } = body

    // Validate filters exist
    if (!filters || typeof filters !== 'object') {
      return NextResponse.json(
        { error: 'filters is required and must be an object' },
        { status: 400 }
      )
    }

    // Check limit
    const count = await getSavedSearchCount(user.id)
    if (count >= SAVED_SEARCH_SETTINGS.MAX_PER_USER) {
      return NextResponse.json(
        { error: `Maximum of ${SAVED_SEARCH_SETTINGS.MAX_PER_USER} saved searches allowed` },
        { status: 400 }
      )
    }

    // Generate name if not provided
    const searchName = name?.trim() || generateSavedSearchName(filters)

    // Validate name length
    if (searchName.length > SAVED_SEARCH_SETTINGS.MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${SAVED_SEARCH_SETTINGS.MAX_NAME_LENGTH} characters or less` },
        { status: 400 }
      )
    }

    const savedSearch = await createSavedSearch(user.id, {
      name: searchName,
      filters,
      alert_frequency,
      alert_email,
    })

    return NextResponse.json({ savedSearch }, { status: 201 })
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to create saved search' },
      { status: 500 }
    )
  }
}
