import { Suspense } from 'react'
import { createAdminClient } from '@/lib/supabase/server'
import { VecnaPipeline } from './components/VecnaPipeline'
import { getTopRequestedGames } from '@/lib/supabase/request-queries'
import type { VecnaFamily, VecnaGame, VecnaState } from '@/lib/vecna'

export const metadata = {
  title: 'Vecna Pipeline | Admin',
  description: 'Automated game content pipeline',
}

interface FamilyRow {
  id: string
  name: string
  slug: string
  base_game_id: string | null
  family_context: Record<string, unknown> | null
}

interface GameRow {
  id: string
  name: string
  slug: string
  year_published: number | null
  thumbnail_url: string | null
  box_image_url: string | null
  hero_image_url: string | null
  vecna_state: VecnaState | null
  vecna_processed_at: string | null
  vecna_error: string | null
  is_published: boolean
  description: string | null

  // BGG data
  bgg_id: number | null
  bgg_raw_data: Record<string, unknown> | null
  bgg_last_synced: string | null
  weight: number | null
  min_age: number | null
  player_count_min: number | null
  player_count_max: number | null
  play_time_min: number | null
  play_time_max: number | null

  // Wikidata
  wikidata_id: string | null
  wikidata_image_url: string | null
  wikidata_series_id: string | null
  official_website: string | null
  wikidata_last_synced: string | null

  // Wikipedia
  wikipedia_url: string | null
  wikipedia_summary: Record<string, unknown> | null
  wikipedia_infobox: Record<string, unknown> | null
  wikipedia_gameplay: string | null
  wikipedia_origins: string | null
  wikipedia_reception: string | null
  wikipedia_images: unknown[] | null
  wikipedia_external_links: unknown[] | null
  wikipedia_awards: unknown[] | null
  wikipedia_search_confidence: string | null
  wikipedia_fetched_at: string | null

  // Rulebook & Content
  rulebook_url: string | null
  rulebook_source: string | null
  rules_content: unknown | null
  setup_content: unknown | null
  reference_content: unknown | null
  crunch_score: number | null
  content_generated_at: string | null

  // Amazon
  amazon_asin: string | null
}

interface CategoryRow {
  id: string
  name: string
  slug: string
  is_primary: boolean
  source: string | null
}

interface MechanicRow {
  id: string
  name: string
  slug: string
  source: string | null
}

interface ThemeRow {
  id: string
  name: string
  slug: string
  source: string | null
}

interface PlayerExperienceRow {
  id: string
  name: string
  slug: string
  is_primary: boolean
}

interface RelationRow {
  source_game_id: string
  target_game_id: string
  relation_type: string
}

async function getFamilies(): Promise<VecnaFamily[]> {
  const supabase = createAdminClient()

  // Get all families with their games
  const { data: families, error: familiesError } = await supabase
    .from('game_families')
    .select(`
      id,
      name,
      slug,
      base_game_id,
      family_context
    `)
    .order('name')

  if (familiesError || !families) {
    console.error('Error fetching families:', familiesError)
    return []
  }

  // Get all games with family_id
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select(`
      id,
      name,
      slug,
      year_published,
      thumbnail_url,
      box_image_url,
      hero_image_url,
      vecna_state,
      vecna_processed_at,
      vecna_error,
      is_published,
      description,
      family_id,
      bgg_id,
      bgg_raw_data,
      bgg_last_synced,
      weight,
      min_age,
      player_count_min,
      player_count_max,
      play_time_min,
      play_time_max,
      wikidata_id,
      wikidata_image_url,
      wikidata_series_id,
      official_website,
      wikidata_last_synced,
      wikipedia_url,
      wikipedia_summary,
      wikipedia_infobox,
      wikipedia_gameplay,
      wikipedia_origins,
      wikipedia_reception,
      wikipedia_images,
      wikipedia_external_links,
      wikipedia_awards,
      wikipedia_search_confidence,
      wikipedia_fetched_at,
      rulebook_url,
      rulebook_source,
      rules_content,
      setup_content,
      reference_content,
      crunch_score,
      content_generated_at,
      amazon_asin
    `)
    .not('family_id', 'is', null)
    .order('year_published', { ascending: true, nullsFirst: false })

  if (gamesError) {
    console.error('Error fetching games:', gamesError)
    return []
  }

  // Get relations for family games
  const gameIds = games?.map(g => g.id) || []
  const { data: relations } = await supabase
    .from('game_relations')
    .select('source_game_id, target_game_id, relation_type')
    .in('source_game_id', gameIds)

  // Get taxonomy for all games
  // Using explicit types to handle schema sync issues
  type GameCategoryJoin = {
    game_id: string
    is_primary: boolean | null
    source: string | null
    categories: { id: string; name: string; slug: string } | null
  }
  type GameMechanicJoin = {
    game_id: string
    source: string | null
    mechanics: { id: string; name: string; slug: string } | null
  }
  type GameThemeJoin = {
    game_id: string
    source: string | null
    themes: { id: string; name: string; slug: string } | null
  }
  type GamePlayerExperienceJoin = {
    game_id: string
    is_primary: boolean | null
    player_experiences: { id: string; name: string; slug: string } | null
  }

  const { data: gameCategories } = await supabase
    .from('game_categories')
    .select('game_id, is_primary, source, categories:category_id(id, name, slug)')
    .in('game_id', gameIds) as { data: GameCategoryJoin[] | null }

  const { data: gameMechanics } = await supabase
    .from('game_mechanics')
    .select('game_id, source, mechanics:mechanic_id(id, name, slug)')
    .in('game_id', gameIds) as { data: GameMechanicJoin[] | null }

  const { data: gameThemes } = await supabase
    .from('game_themes')
    .select('game_id, source, themes:theme_id(id, name, slug)')
    .in('game_id', gameIds) as { data: GameThemeJoin[] | null }

  const { data: gamePlayerExperiences } = await supabase
    .from('game_player_experiences')
    .select('game_id, is_primary, player_experiences:player_experience_id(id, name, slug)')
    .in('game_id', gameIds) as { data: GamePlayerExperienceJoin[] | null }

  // Build taxonomy maps
  const categoriesMap = new Map<string, CategoryRow[]>()
  for (const gc of gameCategories || []) {
    const cat = gc.categories as unknown as { id: string; name: string; slug: string } | null
    if (!cat) continue
    if (!categoriesMap.has(gc.game_id)) categoriesMap.set(gc.game_id, [])
    categoriesMap.get(gc.game_id)!.push({
      ...cat,
      is_primary: gc.is_primary ?? false,
      source: gc.source
    })
  }

  const mechanicsMap = new Map<string, MechanicRow[]>()
  for (const gm of gameMechanics || []) {
    const mech = gm.mechanics as unknown as { id: string; name: string; slug: string } | null
    if (!mech) continue
    if (!mechanicsMap.has(gm.game_id)) mechanicsMap.set(gm.game_id, [])
    mechanicsMap.get(gm.game_id)!.push({
      ...mech,
      source: gm.source
    })
  }

  const themesMap = new Map<string, ThemeRow[]>()
  for (const gt of gameThemes || []) {
    const theme = gt.themes as unknown as { id: string; name: string; slug: string } | null
    if (!theme) continue
    if (!themesMap.has(gt.game_id)) themesMap.set(gt.game_id, [])
    themesMap.get(gt.game_id)!.push({
      ...theme,
      source: gt.source
    })
  }

  const playerExperiencesMap = new Map<string, PlayerExperienceRow[]>()
  for (const gpe of gamePlayerExperiences || []) {
    const pe = gpe.player_experiences as unknown as { id: string; name: string; slug: string } | null
    if (!pe) continue
    if (!playerExperiencesMap.has(gpe.game_id)) playerExperiencesMap.set(gpe.game_id, [])
    playerExperiencesMap.get(gpe.game_id)!.push({
      ...pe,
      is_primary: gpe.is_primary ?? false
    })
  }

  // Build a map of game relations
  const gameRelations = new Map<string, { type: string; targetId: string }>()
  for (const rel of (relations as RelationRow[] | null) || []) {
    gameRelations.set(rel.source_game_id, {
      type: rel.relation_type,
      targetId: rel.target_game_id,
    })
  }

  // Build game ID to name map for relation display
  const gameNameMap = new Map<string, string>()
  for (const game of games || []) {
    gameNameMap.set(game.id, game.name)
  }

  // Group games by family
  const gamesByFamily = new Map<string, GameRow[]>()
  for (const game of (games as GameRow[] | null) || []) {
    const familyId = (game as unknown as { family_id: string }).family_id
    if (!gamesByFamily.has(familyId)) {
      gamesByFamily.set(familyId, [])
    }
    gamesByFamily.get(familyId)!.push(game)
  }

  // Transform to VecnaFamily format
  return (families as FamilyRow[]).map((family): VecnaFamily => {
    const familyGames = gamesByFamily.get(family.id) || []

    // Sort: base game first, then by year
    const sortedGames = [...familyGames].sort((a, b) => {
      // Base game always first
      if (a.id === family.base_game_id) return -1
      if (b.id === family.base_game_id) return 1

      // Then by year
      const yearA = a.year_published || 9999
      const yearB = b.year_published || 9999
      return yearA - yearB
    })

    const vecnaGames: VecnaGame[] = sortedGames.map((game): VecnaGame => {
      const relation = gameRelations.get(game.id)
      const relationTargetName = relation ? gameNameMap.get(relation.targetId) : undefined

      return {
        id: game.id,
        name: game.name,
        slug: game.slug,
        year_published: game.year_published,
        thumbnail_url: game.thumbnail_url || (game.bgg_raw_data?.thumbnail as string | undefined) || null,
        box_image_url: game.box_image_url || (game.bgg_raw_data?.image as string | undefined) || null,
        hero_image_url: game.hero_image_url,
        vecna_state: game.vecna_state || 'imported',
        vecna_processed_at: game.vecna_processed_at,
        vecna_error: game.vecna_error,
        relation_type: relation?.type,
        relation_to_base: relationTargetName,
        has_rulebook: !!game.rulebook_url,
        has_wikipedia: !!game.wikipedia_url,
        has_wikidata: !!game.wikidata_id,
        has_content: !!game.rules_content,
        is_published: game.is_published,
        crunch_score: game.crunch_score,
        description: game.description,

        // BGG data
        bgg_id: game.bgg_id,
        bgg_raw_data: game.bgg_raw_data as VecnaGame['bgg_raw_data'],
        bgg_last_synced: game.bgg_last_synced,
        weight: game.weight,
        min_age: game.min_age,
        player_count_min: game.player_count_min,
        player_count_max: game.player_count_max,
        play_time_min: game.play_time_min,
        play_time_max: game.play_time_max,

        // Wikidata
        wikidata_id: game.wikidata_id,
        wikidata_image_url: game.wikidata_image_url,
        wikidata_series_id: game.wikidata_series_id,
        official_website: game.official_website,
        wikidata_last_synced: game.wikidata_last_synced,

        // Wikipedia
        wikipedia_url: game.wikipedia_url,
        wikipedia_summary: game.wikipedia_summary as VecnaGame['wikipedia_summary'],
        wikipedia_infobox: game.wikipedia_infobox as VecnaGame['wikipedia_infobox'],
        wikipedia_gameplay: game.wikipedia_gameplay,
        wikipedia_origins: game.wikipedia_origins,
        wikipedia_reception: game.wikipedia_reception,
        wikipedia_images: game.wikipedia_images as VecnaGame['wikipedia_images'],
        wikipedia_external_links: game.wikipedia_external_links as VecnaGame['wikipedia_external_links'],
        wikipedia_awards: game.wikipedia_awards as VecnaGame['wikipedia_awards'],
        wikipedia_search_confidence: game.wikipedia_search_confidence as VecnaGame['wikipedia_search_confidence'],
        wikipedia_fetched_at: game.wikipedia_fetched_at,

        // Rulebook & Content
        rulebook_url: game.rulebook_url,
        rulebook_source: game.rulebook_source,
        rules_content: game.rules_content as VecnaGame['rules_content'],
        setup_content: game.setup_content as VecnaGame['setup_content'],
        reference_content: game.reference_content as VecnaGame['reference_content'],
        content_generated_at: game.content_generated_at,

        // Amazon
        amazon_asin: game.amazon_asin,

        // Taxonomy
        categories: categoriesMap.get(game.id) || [],
        mechanics: mechanicsMap.get(game.id) || [],
        themes: themesMap.get(game.id) || [],
        player_experiences: playerExperiencesMap.get(game.id) || [],
      }
    })

    // Calculate stats
    const publishedCount = vecnaGames.filter(g => g.is_published).length
    const reviewCount = vecnaGames.filter(g => g.vecna_state === 'review_pending' || g.vecna_state === 'generated').length
    const missingRulebookCount = vecnaGames.filter(g => !g.has_rulebook && g.vecna_state !== 'published').length

    return {
      id: family.id,
      name: family.name,
      slug: family.slug,
      base_game_id: family.base_game_id,
      family_context: family.family_context as VecnaFamily['family_context'],
      games: vecnaGames,
      total_games: vecnaGames.length,
      published_count: publishedCount,
      ready_for_review_count: reviewCount,
      missing_rulebook_count: missingRulebookCount,
    }
  }).filter(f => f.total_games > 0) // Only show families with games
}

// Get standalone games (no family)
async function getStandaloneGames(): Promise<VecnaGame[]> {
  const supabase = createAdminClient()

  const { data: games, error } = await supabase
    .from('games')
    .select(`
      id,
      name,
      slug,
      year_published,
      thumbnail_url,
      box_image_url,
      hero_image_url,
      vecna_state,
      vecna_processed_at,
      vecna_error,
      is_published,
      description,
      bgg_id,
      bgg_raw_data,
      bgg_last_synced,
      weight,
      min_age,
      player_count_min,
      player_count_max,
      play_time_min,
      play_time_max,
      wikidata_id,
      wikidata_image_url,
      wikidata_series_id,
      official_website,
      wikidata_last_synced,
      wikipedia_url,
      wikipedia_summary,
      wikipedia_infobox,
      wikipedia_gameplay,
      wikipedia_origins,
      wikipedia_reception,
      wikipedia_images,
      wikipedia_external_links,
      wikipedia_awards,
      wikipedia_search_confidence,
      wikipedia_fetched_at,
      rulebook_url,
      rulebook_source,
      rules_content,
      setup_content,
      reference_content,
      crunch_score,
      content_generated_at,
      amazon_asin
    `)
    .is('family_id', null)
    .order('name')

  if (error || !games) {
    console.error('Error fetching standalone games:', error)
    return []
  }

  // Get taxonomy for standalone games
  const gameIds = games.map(g => g.id)

  // Using explicit types to handle schema sync issues
  type GameCategoryJoin = {
    game_id: string
    is_primary: boolean | null
    source: string | null
    categories: { id: string; name: string; slug: string } | null
  }
  type GameMechanicJoin = {
    game_id: string
    source: string | null
    mechanics: { id: string; name: string; slug: string } | null
  }
  type GameThemeJoin = {
    game_id: string
    source: string | null
    themes: { id: string; name: string; slug: string } | null
  }
  type GamePlayerExperienceJoin = {
    game_id: string
    is_primary: boolean | null
    player_experiences: { id: string; name: string; slug: string } | null
  }

  const { data: gameCategories } = await supabase
    .from('game_categories')
    .select('game_id, is_primary, source, categories:category_id(id, name, slug)')
    .in('game_id', gameIds) as { data: GameCategoryJoin[] | null }

  const { data: gameMechanics } = await supabase
    .from('game_mechanics')
    .select('game_id, source, mechanics:mechanic_id(id, name, slug)')
    .in('game_id', gameIds) as { data: GameMechanicJoin[] | null }

  const { data: gameThemes } = await supabase
    .from('game_themes')
    .select('game_id, source, themes:theme_id(id, name, slug)')
    .in('game_id', gameIds) as { data: GameThemeJoin[] | null }

  const { data: gamePlayerExperiences } = await supabase
    .from('game_player_experiences')
    .select('game_id, is_primary, player_experiences:player_experience_id(id, name, slug)')
    .in('game_id', gameIds) as { data: GamePlayerExperienceJoin[] | null }

  // Build taxonomy maps
  const categoriesMap = new Map<string, CategoryRow[]>()
  for (const gc of gameCategories || []) {
    const cat = gc.categories as unknown as { id: string; name: string; slug: string } | null
    if (!cat) continue
    if (!categoriesMap.has(gc.game_id)) categoriesMap.set(gc.game_id, [])
    categoriesMap.get(gc.game_id)!.push({
      ...cat,
      is_primary: gc.is_primary ?? false,
      source: gc.source
    })
  }

  const mechanicsMap = new Map<string, MechanicRow[]>()
  for (const gm of gameMechanics || []) {
    const mech = gm.mechanics as unknown as { id: string; name: string; slug: string } | null
    if (!mech) continue
    if (!mechanicsMap.has(gm.game_id)) mechanicsMap.set(gm.game_id, [])
    mechanicsMap.get(gm.game_id)!.push({
      ...mech,
      source: gm.source
    })
  }

  const themesMap = new Map<string, ThemeRow[]>()
  for (const gt of gameThemes || []) {
    const theme = gt.themes as unknown as { id: string; name: string; slug: string } | null
    if (!theme) continue
    if (!themesMap.has(gt.game_id)) themesMap.set(gt.game_id, [])
    themesMap.get(gt.game_id)!.push({
      ...theme,
      source: gt.source
    })
  }

  const playerExperiencesMap = new Map<string, PlayerExperienceRow[]>()
  for (const gpe of gamePlayerExperiences || []) {
    const pe = gpe.player_experiences as unknown as { id: string; name: string; slug: string } | null
    if (!pe) continue
    if (!playerExperiencesMap.has(gpe.game_id)) playerExperiencesMap.set(gpe.game_id, [])
    playerExperiencesMap.get(gpe.game_id)!.push({
      ...pe,
      is_primary: gpe.is_primary ?? false
    })
  }

  return (games as GameRow[]).map((game): VecnaGame => ({
    id: game.id,
    name: game.name,
    slug: game.slug,
    year_published: game.year_published,
    thumbnail_url: game.thumbnail_url || (game.bgg_raw_data?.thumbnail as string | undefined) || null,
    box_image_url: game.box_image_url || (game.bgg_raw_data?.image as string | undefined) || null,
    hero_image_url: game.hero_image_url,
    vecna_state: game.vecna_state || 'imported',
    vecna_processed_at: game.vecna_processed_at,
    vecna_error: game.vecna_error,
    has_rulebook: !!game.rulebook_url,
    has_wikipedia: !!game.wikipedia_url,
    has_wikidata: !!game.wikidata_id,
    has_content: !!game.rules_content,
    is_published: game.is_published,
    crunch_score: game.crunch_score,
    description: game.description,

    // BGG data
    bgg_id: game.bgg_id,
    bgg_raw_data: game.bgg_raw_data as VecnaGame['bgg_raw_data'],
    bgg_last_synced: game.bgg_last_synced,
    weight: game.weight,
    min_age: game.min_age,
    player_count_min: game.player_count_min,
    player_count_max: game.player_count_max,
    play_time_min: game.play_time_min,
    play_time_max: game.play_time_max,

    // Wikidata
    wikidata_id: game.wikidata_id,
    wikidata_image_url: game.wikidata_image_url,
    wikidata_series_id: game.wikidata_series_id,
    official_website: game.official_website,
    wikidata_last_synced: game.wikidata_last_synced,

    // Wikipedia
    wikipedia_url: game.wikipedia_url,
    wikipedia_summary: game.wikipedia_summary as VecnaGame['wikipedia_summary'],
    wikipedia_infobox: game.wikipedia_infobox as VecnaGame['wikipedia_infobox'],
    wikipedia_gameplay: game.wikipedia_gameplay,
    wikipedia_origins: game.wikipedia_origins,
    wikipedia_reception: game.wikipedia_reception,
    wikipedia_images: game.wikipedia_images as VecnaGame['wikipedia_images'],
    wikipedia_external_links: game.wikipedia_external_links as VecnaGame['wikipedia_external_links'],
    wikipedia_awards: game.wikipedia_awards as VecnaGame['wikipedia_awards'],
    wikipedia_search_confidence: game.wikipedia_search_confidence as VecnaGame['wikipedia_search_confidence'],
    wikipedia_fetched_at: game.wikipedia_fetched_at,

    // Rulebook & Content
    rulebook_url: game.rulebook_url,
    rulebook_source: game.rulebook_source,
    rules_content: game.rules_content as VecnaGame['rules_content'],
    setup_content: game.setup_content as VecnaGame['setup_content'],
    reference_content: game.reference_content as VecnaGame['reference_content'],
    content_generated_at: game.content_generated_at,

    // Amazon
    amazon_asin: game.amazon_asin,

    // Taxonomy
    categories: categoriesMap.get(game.id) || [],
    mechanics: mechanicsMap.get(game.id) || [],
    themes: themesMap.get(game.id) || [],
    player_experiences: playerExperiencesMap.get(game.id) || [],
  }))
}

// Get most requested games with game details
async function getMostRequestedGames(): Promise<{ game: VecnaGame; requestCount: number }[]> {
  const supabase = createAdminClient()
  const topRequested = await getTopRequestedGames(10)

  if (topRequested.length === 0) return []

  // Fetch game details for requested games
  const gameIds = topRequested.map(r => r.game_id)
  const { data: games } = await supabase
    .from('games')
    .select(`
      id,
      name,
      slug,
      year_published,
      thumbnail_url,
      box_image_url,
      vecna_state,
      is_published,
      bgg_id
    `)
    .in('id', gameIds)

  if (!games) return []

  // Map games with request counts
  const gameMap = new Map(games.map(g => [g.id, g]))
  return topRequested
    .filter(r => gameMap.has(r.game_id))
    .map(r => ({
      game: {
        id: gameMap.get(r.game_id)!.id,
        name: gameMap.get(r.game_id)!.name,
        slug: gameMap.get(r.game_id)!.slug,
        year_published: gameMap.get(r.game_id)!.year_published,
        thumbnail_url: gameMap.get(r.game_id)!.thumbnail_url,
        box_image_url: gameMap.get(r.game_id)!.box_image_url,
        vecna_state: (gameMap.get(r.game_id)!.vecna_state || 'imported') as VecnaState,
        is_published: gameMap.get(r.game_id)!.is_published,
        bgg_id: gameMap.get(r.game_id)!.bgg_id,
        // Minimal VecnaGame fields
        vecna_processed_at: null,
        vecna_error: null,
        has_rulebook: false,
        has_wikipedia: false,
        has_wikidata: false,
        has_content: false,
        crunch_score: null,
        description: null,
        hero_image_url: null,
        bgg_raw_data: null,
        bgg_last_synced: null,
        weight: null,
        min_age: null,
        player_count_min: null,
        player_count_max: null,
        play_time_min: null,
        play_time_max: null,
        wikidata_id: null,
        wikidata_image_url: null,
        wikidata_series_id: null,
        official_website: null,
        wikidata_last_synced: null,
        wikipedia_url: null,
        wikipedia_summary: null,
        wikipedia_infobox: null,
        wikipedia_gameplay: null,
        wikipedia_origins: null,
        wikipedia_reception: null,
        wikipedia_images: null,
        wikipedia_external_links: null,
        wikipedia_awards: null,
        wikipedia_search_confidence: null,
        wikipedia_fetched_at: null,
        rulebook_url: null,
        rulebook_source: null,
        rules_content: null,
        setup_content: null,
        reference_content: null,
        content_generated_at: null,
        amazon_asin: null,
        categories: [],
        mechanics: [],
        themes: [],
        player_experiences: [],
      } as VecnaGame,
      requestCount: r.request_count,
    }))
}

export default async function VecnaPage() {
  const [families, standaloneGames, mostRequested] = await Promise.all([
    getFamilies(),
    getStandaloneGames(),
    getMostRequestedGames(),
  ])

  return (
    <div className="h-[calc(100vh-4rem)]">
      <Suspense fallback={<div className="p-8">Loading pipeline...</div>}>
        <VecnaPipeline
          families={families}
          standaloneGames={standaloneGames}
          mostRequestedGames={mostRequested}
        />
      </Suspense>
    </div>
  )
}
