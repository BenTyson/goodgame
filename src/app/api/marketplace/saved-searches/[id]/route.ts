/**
 * Saved Search Detail API
 *
 * GET - Get a single saved search
 * PATCH - Update a saved search
 * DELETE - Delete a saved search
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getSavedSearch,
  updateSavedSearch,
  deleteSavedSearch,
} from '@/lib/supabase/discovery-queries'
import type { UpdateSavedSearchRequest, SavedSearch } from '@/types/marketplace'
import { SAVED_SEARCH_SETTINGS } from '@/lib/config/marketplace-constants'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET - Get a single saved search by ID
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const savedSearch = await getSavedSearch(id, user.id)

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ savedSearch })
  } catch (error) {
    console.error('Error fetching saved search:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved search' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update a saved search
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json() as UpdateSavedSearchRequest

    // Validate name length if provided
    if (body.name && body.name.length > SAVED_SEARCH_SETTINGS.MAX_NAME_LENGTH) {
      return NextResponse.json(
        { error: `Name must be ${SAVED_SEARCH_SETTINGS.MAX_NAME_LENGTH} characters or less` },
        { status: 400 }
      )
    }

    // Check if saved search exists
    const existing = await getSavedSearch(id, user.id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    const savedSearch = await updateSavedSearch(id, user.id, body)

    return NextResponse.json({ savedSearch })
  } catch (error) {
    console.error('Error updating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    )
  }
}

/**
 * DELETE - Delete a saved search
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if saved search exists
    const existing = await getSavedSearch(id, user.id)
    if (!existing) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    await deleteSavedSearch(id, user.id)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    )
  }
}
