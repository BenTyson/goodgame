/**
 * Puffin Content Importer
 *
 * Imports AI-generated content from Puffin into Boardmello's games table.
 * Supports feed-based sync (cursor pagination), batch import, and single game import.
 *
 * Content priority rules:
 * 1. Always store full puffin_content JSONB blob
 * 2. Map tagline to games.tagline ONLY if currently null
 * 3. Map description to games.description ONLY if currently null
 * 4. Never touch rules_content, setup_content, reference_content, vecna_state
 * 5. Skip if puffin_content_updated_at >= incoming timestamp
 */

import { createAdminClient } from '@/lib/supabase/admin'
import {
  fetchPuffinContentFeed,
  fetchPuffinContentBatch,
  fetchPuffinContentSingle,
  type PuffinContentFields,
  type PuffinContentCompleteness,
} from './client'
import type { Json } from '@/types/supabase'

// ============================================================================
// TYPES
// ============================================================================

export interface ContentImportResult {
  bggId: number
  updated: boolean
  skipped: boolean
  error?: string
}

export interface ContentSyncResult {
  processed: number
  updated: number
  skipped: number
  errors: string[]
  cursor: string
  hasMore: boolean
}

export interface SyncStatus {
  cursor: string
  lastRunAt: string | null
  gamesWithContent: number
  gamesWithoutContent: number
  metadata: Record<string, unknown> | null
}

// ============================================================================
// CURSOR HELPERS
// ============================================================================

const CURSOR_KEY = 'puffin_content_feed'
const EPOCH = '1970-01-01T00:00:00.000Z'

/**
 * Read the sync cursor from the database
 * Gracefully falls back to epoch if table doesn't exist yet (migration not applied)
 */
async function getSyncCursor(): Promise<{ cursor: string; metadata: Record<string, unknown> | null }> {
  try {
    const supabase = createAdminClient()
    const { data, error } = await supabase
      .from('sync_cursors')
      .select('cursor_value, metadata')
      .eq('key', CURSOR_KEY)
      .single()

    if (error || !data) {
      return { cursor: EPOCH, metadata: null }
    }

    return {
      cursor: data.cursor_value,
      metadata: data.metadata as Record<string, unknown> | null,
    }
  } catch {
    // Table may not exist yet - graceful degradation per DECISIONS.md
    return { cursor: EPOCH, metadata: null }
  }
}

/**
 * Update the sync cursor in the database
 */
async function updateSyncCursor(
  cursor: string,
  metadata?: Record<string, Json | undefined>
): Promise<void> {
  try {
    const supabase = createAdminClient()
    await supabase
      .from('sync_cursors')
      .upsert({
        key: CURSOR_KEY,
        cursor_value: cursor,
        updated_at: new Date().toISOString(),
        metadata: metadata as Json,
      })
  } catch (error) {
    console.warn('[Puffin Content] Failed to update sync cursor:', error)
  }
}

// ============================================================================
// CORE IMPORT LOGIC
// ============================================================================

/**
 * Apply content from Puffin to a single game in the database
 * - Skips if game not found by bgg_id
 * - Skips if existing content is newer or equal
 * - Sets tagline/description only if currently null
 * - Never touches vecna_state, rules_content, setup_content, reference_content
 */
async function applyContentToGame(
  bggId: number,
  content: PuffinContentFields,
  completeness: PuffinContentCompleteness,
  contentUpdatedAt: string
): Promise<ContentImportResult> {
  const supabase = createAdminClient()

  // Look up game by bgg_id
  const { data: game, error: lookupError } = await supabase
    .from('games')
    .select('id, tagline, description, puffin_content_updated_at')
    .eq('bgg_id', bggId)
    .single()

  if (lookupError || !game) {
    return { bggId, updated: false, skipped: true, error: 'Game not found' }
  }

  // Skip if existing content is newer or equal
  if (game.puffin_content_updated_at) {
    const existingTime = new Date(game.puffin_content_updated_at).getTime()
    const incomingTime = new Date(contentUpdatedAt).getTime()
    if (existingTime >= incomingTime) {
      return { bggId, updated: false, skipped: true }
    }
  }

  // Build update payload
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const update: Record<string, any> = {
    puffin_content: content as unknown as Json,
    puffin_content_updated_at: contentUpdatedAt,
    puffin_content_completeness: completeness as unknown as Json,
  }

  // Set tagline only if currently null
  if (!game.tagline && content.tagline) {
    update.tagline = content.tagline
  }

  // Set description only if currently null
  if (!game.description && content.description) {
    update.description = content.description
  }

  const { error: updateError } = await supabase
    .from('games')
    .update(update)
    .eq('id', game.id)

  if (updateError) {
    return { bggId, updated: false, skipped: false, error: updateError.message }
  }

  return { bggId, updated: true, skipped: false }
}

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Sync content from Puffin's content feed using cursor-based pagination
 * Reads the cursor, fetches new content, applies it, and advances the cursor
 */
export async function syncContentFromFeed(
  limit: number = 50
): Promise<ContentSyncResult> {
  const { cursor: since } = await getSyncCursor()

  const feedResponse = await fetchPuffinContentFeed(since, limit)

  if (!feedResponse) {
    return {
      processed: 0,
      updated: 0,
      skipped: 0,
      errors: ['Failed to fetch content feed from Puffin'],
      cursor: since,
      hasMore: false,
    }
  }

  let updated = 0
  let skipped = 0
  const errors: string[] = []
  let latestCursor = since

  for (const item of feedResponse.items) {
    const result = await applyContentToGame(
      item.bggId,
      item.content,
      item.completeness,
      item.updatedAt
    )

    if (result.updated) {
      updated++
    } else if (result.skipped) {
      skipped++
    }

    if (result.error) {
      errors.push(`BGG ${item.bggId}: ${result.error}`)
    }

    // Advance cursor to the latest updatedAt
    if (item.updatedAt > latestCursor) {
      latestCursor = item.updatedAt
    }
  }

  // Persist cursor and run metadata
  if (feedResponse.items.length > 0) {
    await updateSyncCursor(latestCursor, {
      lastRunAt: new Date().toISOString(),
      processed: feedResponse.items.length,
      updated,
      skipped,
      errorCount: errors.length,
    })
  }

  return {
    processed: feedResponse.items.length,
    updated,
    skipped,
    errors,
    cursor: latestCursor,
    hasMore: feedResponse.meta.hasMore,
  }
}

/**
 * Import content for specific games by BGG IDs (batch)
 */
export async function importContentForGames(
  bggIds: number[]
): Promise<ContentImportResult[]> {
  const results: ContentImportResult[] = []

  const batchResponse = await fetchPuffinContentBatch(bggIds)

  if (!batchResponse) {
    return bggIds.map(bggId => ({
      bggId,
      updated: false,
      skipped: false,
      error: 'Failed to fetch content from Puffin',
    }))
  }

  // Process found content
  for (const [bggIdStr, data] of Object.entries(batchResponse.content)) {
    const bggId = parseInt(bggIdStr, 10)
    const result = await applyContentToGame(
      bggId,
      data.content,
      data.completeness,
      data.updatedAt
    )
    results.push(result)
  }

  // Report missing games
  for (const missingId of batchResponse.missing) {
    results.push({
      bggId: missingId,
      updated: false,
      skipped: true,
      error: 'No content available in Puffin',
    })
  }

  return results
}

/**
 * Import content for a single game by BGG ID
 */
export async function importContentForSingleGame(
  bggId: number
): Promise<ContentImportResult> {
  const response = await fetchPuffinContentSingle(bggId)

  if (!response) {
    return {
      bggId,
      updated: false,
      skipped: true,
      error: 'No content available in Puffin',
    }
  }

  return applyContentToGame(
    bggId,
    response.content,
    response.completeness,
    response.updatedAt
  )
}

/**
 * Get the current status of content sync
 * Returns cursor position, last run info, and content coverage stats
 */
export async function getContentSyncStatus(): Promise<SyncStatus> {
  const { cursor, metadata } = await getSyncCursor()
  const supabase = createAdminClient()

  // Count games with and without puffin content
  const { count: withContent } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .not('puffin_content', 'is', null)

  const { count: withoutContent } = await supabase
    .from('games')
    .select('id', { count: 'exact', head: true })
    .is('puffin_content', null)
    .not('bgg_id', 'is', null)

  return {
    cursor,
    lastRunAt: (metadata?.lastRunAt as string) || null,
    gamesWithContent: withContent || 0,
    gamesWithoutContent: withoutContent || 0,
    metadata,
  }
}
