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

// Create a new publisher
export async function POST(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { name, slug, description, website, logo_url } = await request.json()

    if (!name || !slug) {
      return NextResponse.json(
        { error: 'Missing required fields: name, slug' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await adminClient
      .from('publishers')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A publisher with this slug already exists' },
        { status: 400 }
      )
    }

    const { data: publisher, error } = await adminClient
      .from('publishers')
      .insert({
        name,
        slug,
        description: description || null,
        website: website || null,
        logo_url: logo_url || null,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ publisher })
  } catch {
    return NextResponse.json({ error: 'Failed to create publisher' }, { status: 500 })
  }
}

// Update a publisher
export async function PATCH(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { publisherId, data } = await request.json()

    if (!publisherId || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: publisherId, data' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // If changing slug, check it doesn't already exist
    if (data.slug) {
      const { data: existing } = await adminClient
        .from('publishers')
        .select('id')
        .eq('slug', data.slug)
        .neq('id', publisherId)
        .single()

      if (existing) {
        return NextResponse.json(
          { error: 'A publisher with this slug already exists' },
          { status: 400 }
        )
      }
    }

    const { data: publisher, error } = await adminClient
      .from('publishers')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', publisherId)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ publisher })
  } catch {
    return NextResponse.json({ error: 'Failed to update publisher' }, { status: 500 })
  }
}

// Delete a publisher
export async function DELETE(request: NextRequest) {
  if (!await isAdmin()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { publisherId, logoStoragePath } = await request.json()

    if (!publisherId) {
      return NextResponse.json(
        { error: 'Missing required field: publisherId' },
        { status: 400 }
      )
    }

    const adminClient = createAdminClient()

    // Delete logo from storage if path provided
    if (logoStoragePath) {
      await adminClient.storage.from('publisher-logos').remove([logoStoragePath])
    }

    // game_publishers junction table has CASCADE delete, so links will be removed
    const { error } = await adminClient
      .from('publishers')
      .delete()
      .eq('id', publisherId)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: 'Failed to delete publisher' }, { status: 500 })
  }
}
