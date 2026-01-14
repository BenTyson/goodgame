import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { ApiErrors } from '@/lib/api/errors'
import { applyRateLimit, RateLimits } from '@/lib/api/rate-limit'

type EntityType = 'designers' | 'publishers' | 'artists'

const VALID_ENTITY_TYPES: EntityType[] = ['designers', 'publishers', 'artists']

function isValidEntityType(type: string): type is EntityType {
  return VALID_ENTITY_TYPES.includes(type as EntityType)
}

/**
 * Generate a URL-safe slug from a name
 */
function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * GET /api/admin/entities?type=designers&q=search
 * Search entities by name (for autocomplete)
 */
export async function GET(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type')
    const query = searchParams.get('q') || ''
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    if (!type || !isValidEntityType(type)) {
      return ApiErrors.validation(`Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`)
    }

    const adminClient = createAdminClient()

    // Search by name with ilike for case-insensitive matching
    let queryBuilder = adminClient
      .from(type)
      .select('id, name, slug')
      .order('name')
      .limit(limit)

    if (query.trim()) {
      queryBuilder = queryBuilder.ilike('name', `%${query}%`)
    }

    const { data, error } = await queryBuilder

    if (error) {
      return ApiErrors.database(error, { route: `GET /api/admin/entities?type=${type}` })
    }

    return NextResponse.json({ entities: data || [] })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'GET /api/admin/entities' })
  }
}

/**
 * POST /api/admin/entities
 * Create a new entity
 * Body: { type: 'designers'|'publishers'|'artists', name: string }
 */
export async function POST(request: NextRequest) {
  const rateLimited = applyRateLimit(request, RateLimits.ADMIN_STANDARD)
  if (rateLimited) return rateLimited

  if (!await isAdmin()) {
    return ApiErrors.unauthorized()
  }

  try {
    const { type, name } = await request.json()

    if (!type || !isValidEntityType(type)) {
      return ApiErrors.validation(`Invalid entity type. Must be one of: ${VALID_ENTITY_TYPES.join(', ')}`)
    }

    if (!name || typeof name !== 'string' || !name.trim()) {
      return ApiErrors.validation('Name is required')
    }

    const trimmedName = name.trim()
    const slug = slugify(trimmedName)

    if (!slug) {
      return ApiErrors.validation('Could not generate a valid slug from the name')
    }

    const adminClient = createAdminClient()

    // Check if slug already exists
    const { data: existing } = await adminClient
      .from(type)
      .select('id, name, slug')
      .eq('slug', slug)
      .single()

    if (existing) {
      // Return the existing entity instead of error - this is fine for autocomplete flows
      return NextResponse.json({ entity: existing, existed: true })
    }

    // Create new entity
    const { data: entity, error } = await adminClient
      .from(type)
      .insert({ name: trimmedName, slug })
      .select('id, name, slug')
      .single()

    if (error) {
      return ApiErrors.database(error, { route: `POST /api/admin/entities (${type})` })
    }

    return NextResponse.json({ entity, existed: false })
  } catch (error) {
    return ApiErrors.internal(error, { route: 'POST /api/admin/entities' })
  }
}
