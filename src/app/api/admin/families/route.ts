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

// Create a new family
export async function POST(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, slug, description, hero_image_url } = await request.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await adminClient
      .from('game_families')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A family with this slug already exists' },
        { status: 400 }
      )
    }

    const { data: family, error } = await adminClient
      .from('game_families')
      .insert({
        name,
        slug,
        description: description || null,
        hero_image_url: hero_image_url || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ family })
  } catch {
    return NextResponse.json({ error: 'Failed to create family' }, { status: 500 })
  }
}

// Update a family
export async function PATCH(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { familyId, data } = await request.json()

    if (!familyId || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: familyId, data' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // If changing slug, check it doesn't already exist
    if (data.slug) {
      const { data: existing } = await adminClient
        .from('game_families')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', familyId)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'A family with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const { data: family, error } = await adminClient
      .from('game_families')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', familyId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ family })
  } catch {
    return NextResponse.json({ error: 'Failed to update family' }, { status: 500 })
  }
}

// Delete a family
export async function DELETE(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { familyId } = await request.json()

    if (!familyId) {
      return NextResponse.json(
        { error: 'Missing required field: familyId' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // First, remove family_id from all games in this family
    await adminClient
      .from('games')
      .update({ family_id: null })
      .eq('family_id', familyId)

    // Then delete the family
    const { error } = await adminClient
      .from('game_families')
      .delete()
      .eq('id', familyId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete family' }, { status: 500 })
  }
}
