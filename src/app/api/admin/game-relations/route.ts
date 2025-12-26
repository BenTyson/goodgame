import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { NextRequest, NextResponse } from 'next/server'
import type { Database } from '@/types/supabase'

// Create admin client with service role for database operations
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

// Create a new game relation
export async function POST(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { sourceGameId, targetGameId, relationType } = await request.json()

    if (!sourceGameId || !targetGameId || !relationType) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceGameId, targetGameId, relationType' },
        { status: 400 }
      )
    }

    if (sourceGameId === targetGameId) {
      return NextResponse.json(
        { error: 'Cannot create a relation to the same game' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Check if relation already exists
    const { data: existing } = await adminClient
      .from('game_relations')
      .select('id')
      .eq('source_game_id', sourceGameId)
      .eq('target_game_id', targetGameId)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A relation between these games already exists' },
        { status: 400 }
      )
    }

    const { data: relation, error } = await adminClient
      .from('game_relations')
      .insert({
        source_game_id: sourceGameId,
        target_game_id: targetGameId,
        relation_type: relationType,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ relation })
  } catch {
    return NextResponse.json({ error: 'Failed to create relation' }, { status: 500 })
  }
}

// Delete a game relation
export async function DELETE(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { relationId } = await request.json()

    if (!relationId) {
      return NextResponse.json(
        { error: 'Missing required field: relationId' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { error } = await adminClient
      .from('game_relations')
      .delete()
      .eq('id', relationId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete relation' }, { status: 500 })
  }
}

// Update a game relation
export async function PATCH(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { relationId, relationType } = await request.json()

    if (!relationId || !relationType) {
      return NextResponse.json(
        { error: 'Missing required fields: relationId, relationType' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    const { data: relation, error } = await adminClient
      .from('game_relations')
      .update({ relation_type: relationType })
      .eq('id', relationId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ relation })
  } catch {
    return NextResponse.json({ error: 'Failed to update relation' }, { status: 500 })
  }
}
