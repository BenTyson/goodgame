import { NextRequest } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import { importGameFromBGG, syncGameWithBGG } from '@/lib/bgg/importer'
import { fetchBGGGame, fetchBGGGames } from '@/lib/bgg/client'

interface ExecuteRequest {
  bggIds: number[]
  relationMode: 'all' | 'upstream' | 'none'
  maxDepth: number
  resyncExisting: boolean
  excludedBggIds?: number[]
}

interface ProgressEvent {
  type: 'progress'
  bggId: number
  name: string
  status: 'importing' | 'syncing' | 'success' | 'failed' | 'skipped'
  error?: string
  gameId?: string
  slug?: string
  familyId?: string
  familyName?: string
}

interface CompleteEvent {
  type: 'complete'
  summary: {
    imported: number
    synced: number
    failed: number
    skipped: number
    duration: number
  }
}

type SSEEvent = ProgressEvent | CompleteEvent

/**
 * POST /api/admin/import/execute
 * Execute import with SSE streaming progress
 */
export async function POST(request: NextRequest) {
  // Check admin status
  if (!await isAdmin()) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  let body: ExecuteRequest
  try {
    body = await request.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { bggIds, relationMode = 'upstream', maxDepth = 3, resyncExisting = true, excludedBggIds = [] } = body

  if (!bggIds || !Array.isArray(bggIds) || bggIds.length === 0) {
    return new Response(JSON.stringify({ error: 'At least one BGG ID is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  // Convert excluded IDs to a Set for O(1) lookup
  const excludedSet = new Set(excludedBggIds)

  // Create a streaming response
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: SSEEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`
        controller.enqueue(encoder.encode(data))
      }

      const startTime = Date.now()
      let imported = 0
      let synced = 0
      let failed = 0
      let skipped = 0

      const supabase = createAdminClient()

      // Minimum ratings threshold to filter out fan expansions
      const MIN_RATINGS_THRESHOLD = 50

      // Promo-related keywords in names
      const PROMO_NAME_PATTERNS = [
        /\bpromo\b/i,
        /\bpromotional\b/i,
        /\bmini.?expansion\b/i,
        /\bbonus card/i,
        /\bextra card/i,
      ]

      // Accessory/component keywords in names (not actual gameplay expansions)
      const ACCESSORY_NAME_PATTERNS = [
        /\bsticker set\b/i,
        /\bsticker.?pack\b/i,
        /\bsleeve/i,
        /\borganizer\b/i,
        /\binsert\b/i,
        /\bupgrade kit\b/i,
        /\breplacement\b/i,
        /\bstorage\b/i,
        /\bplaymat\b/i,
        /\bplay mat\b/i,
        /\bcoin set\b/i,
        /\bmetal coin/i,
        /\btoken set\b/i,
        /\btoken pack\b/i,
        /\btoken upgrade/i,
        /\bresource upgrade/i,
        /\bdeluxe token/i,
        /\bdeluxe component/i,
        /\b3d.?print/i,
        /\bremovable sticker/i,
      ]

      // Promo-related BGG family names
      const PROMO_FAMILY_PATTERNS = [
        'promotional',
        'promo',
        'bgg store',
        'kickstarter exclusive',
        'convention exclusive',
        'bonus content',
      ]

      // Accessory-related BGG family names
      const ACCESSORY_FAMILY_PATTERNS = [
        'reset/recharge',
        'upgrade kit',
        'storage solution',
        'game insert',
        'organizer',
        'component upgrade',
        'accessories',
      ]

      // Helper to check if a game should be filtered out (fan expansion, promo, or accessory)
      const shouldFilterExpansion = (game: Awaited<ReturnType<typeof fetchBGGGames>> extends Map<number, infer T> ? T : never): { filter: boolean; reason?: string } => {
        if (!game) return { filter: true, reason: 'No data' }

        const familyNames = game.families?.map(f => f.name.toLowerCase()) || []

        // Fan expansions typically have very few ratings
        if (game.numRatings < MIN_RATINGS_THRESHOLD) {
          return { filter: true, reason: `Fan expansion (${game.numRatings} ratings)` }
        }

        // Check for "Fan Expansion" in families
        if (game.families?.some(f => f.name.toLowerCase().includes('fan expansion'))) {
          return { filter: true, reason: 'Fan expansion family' }
        }

        // Check for promo patterns in name
        for (const pattern of PROMO_NAME_PATTERNS) {
          if (pattern.test(game.name)) {
            return { filter: true, reason: 'Promo (name match)' }
          }
        }

        // Check for accessory patterns in name
        for (const pattern of ACCESSORY_NAME_PATTERNS) {
          if (pattern.test(game.name)) {
            return { filter: true, reason: 'Accessory (name match)' }
          }
        }

        // Check for promo-related families
        for (const promoPattern of PROMO_FAMILY_PATTERNS) {
          if (familyNames.some(fn => fn.includes(promoPattern))) {
            return { filter: true, reason: 'Promo family' }
          }
        }

        // Check for accessory-related families
        for (const accessoryPattern of ACCESSORY_FAMILY_PATTERNS) {
          if (familyNames.some(fn => fn.includes(accessoryPattern))) {
            return { filter: true, reason: 'Accessory family' }
          }
        }

        return { filter: false }
      }

      // Collect all BGG IDs to import (including relations if mode is 'all')
      let allBggIds = [...bggIds]
      const processedIds = new Set<number>()

      // If relationMode is 'all', we need to recursively collect related game IDs
      if (relationMode === 'all') {
        const collectRelatedIds = async (ids: number[], depth: number): Promise<number[]> => {
          if (depth <= 0 && maxDepth !== 0) return []

          const relatedIds: number[] = []
          const bggDataMap = await fetchBGGGames(ids)

          for (const [bggId, bggData] of bggDataMap) {
            if (!bggData || processedIds.has(bggId)) continue
            processedIds.add(bggId)

            // Collect expansion IDs (downstream) - we'll filter fan expansions later
            if (bggData.expansions) {
              for (const exp of bggData.expansions) {
                // Skip if already processed or explicitly excluded by user
                if (!processedIds.has(exp.id) && !excludedSet.has(exp.id)) {
                  relatedIds.push(exp.id)
                }
              }
            }

            // Collect base game ID (upstream) - skip if excluded
            if (bggData.expandsGame && !processedIds.has(bggData.expandsGame.id) && !excludedSet.has(bggData.expandsGame.id)) {
              relatedIds.push(bggData.expandsGame.id)
            }

            // Collect reimplementation IDs (both directions) - skip if excluded
            if (bggData.implementsGame && !processedIds.has(bggData.implementsGame.id) && !excludedSet.has(bggData.implementsGame.id)) {
              relatedIds.push(bggData.implementsGame.id)
            }
            if (bggData.implementations) {
              for (const reimp of bggData.implementations) {
                if (!processedIds.has(reimp.id) && !excludedSet.has(reimp.id)) {
                  relatedIds.push(reimp.id)
                }
              }
            }
          }

          if (relatedIds.length > 0) {
            // Fetch data for related games to filter fan expansions and promos
            const relatedDataMap = await fetchBGGGames(relatedIds)
            const filteredIds = relatedIds.filter(id => {
              const game = relatedDataMap.get(id)
              if (!game) return false
              // Only filter expansions, not base games or reimplementations
              if (game.type === 'boardgameexpansion') {
                const { filter, reason } = shouldFilterExpansion(game)
                if (filter) {
                  console.log(`[Import] Filtering out: ${game.name} - ${reason}`)
                  return false
                }
              }
              return true
            })

            const nextDepth = maxDepth === 0 ? 0 : depth - 1
            const deeperIds = await collectRelatedIds(filteredIds, nextDepth)
            return [...filteredIds, ...deeperIds]
          }

          return relatedIds
        }

        // Start collecting from depth
        const effectiveDepth = maxDepth === 0 ? 999 : maxDepth
        const relatedIds = await collectRelatedIds(bggIds, effectiveDepth)
        allBggIds = [...new Set([...bggIds, ...relatedIds])]
      }

      // Process each BGG ID
      for (const bggId of allBggIds) {
        // First fetch basic info from BGG for the name
        const bggData = await fetchBGGGame(bggId)
        const gameName = bggData?.name || `BGG ID: ${bggId}`

        // Check if game exists
        const { data: existing } = await supabase
          .from('games')
          .select('id, slug')
          .eq('bgg_id', bggId)
          .single()

        if (existing) {
          if (resyncExisting) {
            // Re-sync existing game
            sendEvent({
              type: 'progress',
              bggId,
              name: gameName,
              status: 'syncing',
            })

            try {
              const result = await syncGameWithBGG(existing.id)
              if (result.success) {
                synced++
                // Get family info
                const { data: gameWithFamily } = await supabase
                  .from('games')
                  .select('family_id, game_families(id, name)')
                  .eq('id', existing.id)
                  .single()
                const family = gameWithFamily?.game_families as { id: string; name: string } | null
                sendEvent({
                  type: 'progress',
                  bggId,
                  name: gameName,
                  status: 'success',
                  gameId: existing.id,
                  slug: existing.slug,
                  familyId: family?.id,
                  familyName: family?.name,
                })
              } else {
                failed++
                sendEvent({
                  type: 'progress',
                  bggId,
                  name: gameName,
                  status: 'failed',
                  error: result.error || 'Sync failed',
                })
              }
            } catch (error) {
              failed++
              sendEvent({
                type: 'progress',
                bggId,
                name: gameName,
                status: 'failed',
                error: error instanceof Error ? error.message : 'Sync failed',
              })
            }
          } else {
            // Skip existing
            skipped++
            sendEvent({
              type: 'progress',
              bggId,
              name: gameName,
              status: 'skipped',
              gameId: existing.id,
              slug: existing.slug,
            })
          }
          continue
        }

        // Import new game
        sendEvent({
          type: 'progress',
          bggId,
          name: gameName,
          status: 'importing',
        })

        try {
          // For 'all' mode, we already collected relations above, so just import parents
          // For 'upstream' mode, let the importer handle parent imports
          // For 'none' mode, don't import any relations
          const importParents = relationMode !== 'none'

          const result = await importGameFromBGG(bggId, {
            importParents: relationMode === 'upstream' ? importParents : false, // 'all' mode handles relations separately
            maxDepth: relationMode === 'upstream' ? maxDepth : 1,
          })

          if (result.success) {
            imported++
            // Get family info
            let familyId: string | undefined
            let familyName: string | undefined
            if (result.gameId) {
              const { data: gameWithFamily } = await supabase
                .from('games')
                .select('family_id, game_families(id, name)')
                .eq('id', result.gameId)
                .single()
              const family = gameWithFamily?.game_families as { id: string; name: string } | null
              familyId = family?.id
              familyName = family?.name
            }
            sendEvent({
              type: 'progress',
              bggId,
              name: result.name || gameName,
              status: 'success',
              gameId: result.gameId,
              slug: result.slug,
              familyId,
              familyName,
            })
          } else {
            failed++
            sendEvent({
              type: 'progress',
              bggId,
              name: gameName,
              status: 'failed',
              error: result.error || 'Import failed',
            })
          }
        } catch (error) {
          failed++
          sendEvent({
            type: 'progress',
            bggId,
            name: gameName,
            status: 'failed',
            error: error instanceof Error ? error.message : 'Import failed',
          })
        }
      }

      // Send completion event
      const duration = (Date.now() - startTime) / 1000
      sendEvent({
        type: 'complete',
        summary: {
          imported,
          synced,
          failed,
          skipped,
          duration: Math.round(duration * 10) / 10,
        },
      })

      controller.close()
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
