import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient, isAdmin } from '@/lib/supabase/admin'
import type { FamilyContext } from '@/lib/vecna'
import type { RulesContent, SetupContent } from '@/lib/rulebook'
import type { Json } from '@/types/database'

/**
 * POST /api/admin/vecna/family/[familyId]/build-context
 *
 * Build and store family context from the base game.
 * This context is used when generating content for expansions.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { familyId } = await params
    const supabase = createAdminClient()

    // Get the family
    const { data: family, error: familyError } = await supabase
      .from('game_families')
      .select('id, name, slug, family_context')
      .eq('id', familyId)
      .single()

    if (familyError || !family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    // Find the base game - look for games in this family that are NOT expansions
    // A base game is one that doesn't have an expansion_of relation
    const { data: familyGames } = await supabase
      .from('games')
      .select(`
        id, name, slug, year_published,
        rules_content, setup_content,
        wikipedia_summary, wikipedia_gameplay,
        vecna_state
      `)
      .eq('family_id', familyId)
      .order('year_published', { ascending: true })

    if (!familyGames || familyGames.length === 0) {
      return NextResponse.json({
        error: 'No games in this family',
        familyId,
        familyName: family.name,
      }, { status: 400 })
    }

    // Get all expansion relations for games in this family
    const gameIds = familyGames.map(g => g.id)
    const { data: expansionRelations } = await supabase
      .from('game_relations')
      .select('source_game_id')
      .in('source_game_id', gameIds)
      .in('relation_type', ['expansion_of', 'standalone_expansion_of'])

    const expansionGameIds = new Set(expansionRelations?.map(r => r.source_game_id) || [])

    // Find base games (games that are not expansions)
    const baseGames = familyGames.filter(g => !expansionGameIds.has(g.id))

    if (baseGames.length === 0) {
      return NextResponse.json({
        error: 'No base game found in this family. All games are expansions.',
        familyId,
        familyName: family.name,
        gamesCount: familyGames.length,
      }, { status: 400 })
    }

    // Use the first base game (usually the original) as the context source
    const baseGame = baseGames[0]

    // Check if base game has content to build context from
    const rulesContent = baseGame.rules_content as RulesContent | null
    const setupContent = baseGame.setup_content as SetupContent | null
    const wikiSummary = baseGame.wikipedia_summary as {
      themes?: string[]
      mechanics?: string[]
      summary?: string
    } | null

    const hasContent = rulesContent || setupContent || wikiSummary

    if (!hasContent) {
      return NextResponse.json({
        warning: 'Base game has no processed content yet',
        familyId,
        familyName: family.name,
        baseGameId: baseGame.id,
        baseGameName: baseGame.name,
        baseGameState: baseGame.vecna_state,
        suggestion: 'Process the base game first to generate content, then rebuild family context.',
      })
    }

    // Build the family context
    const familyContext: FamilyContext = {
      baseGameId: baseGame.id,
      baseGameName: baseGame.name,
      coreMechanics: wikiSummary?.mechanics ||
        rulesContent?.coreRules?.slice(0, 5).map(r => r.title) ||
        [],
      coreTheme: wikiSummary?.themes?.[0] || null,
      baseRulesOverview: rulesContent?.quickStart?.join(' ') ||
        wikiSummary?.summary?.slice(0, 500) ||
        null,
      baseSetupSummary: setupContent?.steps?.slice(0, 5).map(s => s.step).join('. ') || null,
      componentTypes: setupContent?.components?.map(c => c.name) || [],
    }

    // Store the context in the family
    const { error: updateError } = await supabase
      .from('game_families')
      .update({ family_context: familyContext as unknown as Json })
      .eq('id', familyId)

    if (updateError) {
      console.error('Failed to store family context:', updateError)
      return NextResponse.json({
        error: 'Failed to store family context',
        details: updateError.message,
      }, { status: 500 })
    }

    // Count expansions that can now use this context
    const expansionCount = familyGames.length - baseGames.length

    return NextResponse.json({
      success: true,
      familyId: family.id,
      familyName: family.name,
      baseGame: {
        id: baseGame.id,
        name: baseGame.name,
        state: baseGame.vecna_state,
      },
      context: {
        coreMechanicsCount: familyContext.coreMechanics.length,
        hasTheme: !!familyContext.coreTheme,
        hasRulesOverview: !!familyContext.baseRulesOverview,
        hasSetupSummary: !!familyContext.baseSetupSummary,
        componentTypesCount: familyContext.componentTypes.length,
      },
      expansionsReadyForContext: expansionCount,
    })
  } catch (error) {
    console.error('Build family context error:', error)
    return NextResponse.json({ error: 'Failed to build family context' }, { status: 500 })
  }
}

/**
 * GET /api/admin/vecna/family/[familyId]/build-context
 *
 * Get the current family context
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ familyId: string }> }
) {
  try {
    const adminCheck = await isAdmin()
    if (!adminCheck) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { familyId } = await params
    const supabase = createAdminClient()

    // Get the family with context
    const { data: family, error: familyError } = await supabase
      .from('game_families')
      .select('id, name, slug, family_context')
      .eq('id', familyId)
      .single()

    if (familyError || !family) {
      return NextResponse.json({ error: 'Family not found' }, { status: 404 })
    }

    const context = family.family_context as FamilyContext | null

    return NextResponse.json({
      familyId: family.id,
      familyName: family.name,
      hasContext: !!context,
      context: context ? {
        baseGameId: context.baseGameId,
        baseGameName: context.baseGameName,
        coreMechanics: context.coreMechanics,
        coreTheme: context.coreTheme,
        hasRulesOverview: !!context.baseRulesOverview,
        hasSetupSummary: !!context.baseSetupSummary,
        componentTypes: context.componentTypes,
      } : null,
    })
  } catch (error) {
    console.error('Get family context error:', error)
    return NextResponse.json({ error: 'Failed to get family context' }, { status: 500 })
  }
}
