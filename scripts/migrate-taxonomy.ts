/**
 * One-time migration script: Backfill themes and player experiences for existing games
 *
 * Run with: npx tsx scripts/migrate-taxonomy.ts
 */

import { createClient } from '@supabase/supabase-js'
import { parseStringPromise } from 'xml2js'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Rate limiting for BGG API
let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1100

async function waitForRateLimit(): Promise<void> {
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await new Promise(resolve => setTimeout(resolve, MIN_REQUEST_INTERVAL - timeSinceLastRequest))
  }
  lastRequestTime = Date.now()
}

// Fetch BGG data for a game
async function fetchBGGCategories(bggId: number): Promise<{ categories: string[], mechanics: string[], categoryLinks: BGGLink[], mechanicLinks: BGGLink[] } | null> {
  await waitForRateLimit()

  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${bggId}&stats=1`

  const headers: Record<string, string> = {}
  if (process.env.BGG_API_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.BGG_API_TOKEN}`
  }

  try {
    const response = await fetch(url, { headers })
    if (!response.ok) {
      console.error(`BGG API error for ${bggId}: ${response.status}`)
      return null
    }

    const xml = await response.text()
    const result = await parseStringPromise(xml)

    if (!result.items?.item?.[0]) {
      return null
    }

    const item = result.items.item[0]
    const links = item.link || []

    const categories: string[] = []
    const mechanics: string[] = []
    const categoryLinks: BGGLink[] = []
    const mechanicLinks: BGGLink[] = []

    for (const link of links) {
      if (link.$ && link.$.type === 'boardgamecategory') {
        categories.push(link.$.value)
        categoryLinks.push({ id: parseInt(link.$.id, 10), name: link.$.value })
      } else if (link.$ && link.$.type === 'boardgamemechanic') {
        mechanics.push(link.$.value)
        mechanicLinks.push({ id: parseInt(link.$.id, 10), name: link.$.value })
      }
    }

    return { categories, mechanics, categoryLinks, mechanicLinks }
  } catch (error) {
    console.error(`Error fetching BGG data for ${bggId}:`, error)
    return null
  }
}

// BGG to theme slug mappings (simplified version of bgg-mappings.ts)
const BGG_THEME_MAP: Record<string, string> = {
  'Fantasy': 'fantasy',
  'Science Fiction': 'sci-fi',
  'Horror': 'horror',
  'Medieval': 'medieval',
  'Ancient': 'historical',
  'Renaissance': 'historical',
  'World War I': 'war',
  'World War II': 'war',
  'American Civil War': 'war',
  'Napoleonic': 'war',
  'Vietnam War': 'war',
  'Korean War': 'war',
  'Mythology': 'mythology',
  'Arabian': 'mythology',
  'Greek Mythology': 'mythology',
  'Animals': 'nature',
  'Environmental': 'nature',
  'Farming': 'nature',
  'Pirates': 'pirates',
  'Nautical': 'pirates',
  'Murder/Mystery': 'mystery',
  'Spies/Secret Agents': 'mystery',
  'Zombies': 'horror',
  'Post-Apocalyptic': 'sci-fi',
  'Space Exploration': 'sci-fi',
  'Economic': 'economic',
  'Industry / Manufacturing': 'economic',
  'Civilization': 'historical',
  'City Building': 'historical',
  'Territory Building': 'war',
  'Wargame': 'war',
  'Abstract Strategy': 'abstract',
}

// BGG to player experience slug mappings
const BGG_EXPERIENCE_MAP: Record<string, string> = {
  // Categories
  'Party Game': 'social',
  'Trivia': 'social',
  'Word Game': 'social',
  'Humor': 'social',
  'Bluffing': 'hidden-roles',
  'Deduction': 'hidden-roles',
  'Negotiation': 'social',
  // Mechanics that indicate experiences
  'Cooperative Game': 'cooperative',
  'Solo / Solitaire Game': 'solo',
  'Team-Based Game': 'team-based',
  'Traitor Game': 'hidden-roles',
  'Hidden Roles': 'hidden-roles',
  'Storytelling': 'narrative',
  'Role Playing': 'narrative',
  'Campaign / Battle Card Driven': 'narrative',
  'Legacy Game': 'narrative',
  'Auction/Bidding': 'competitive',
  'Player Elimination': 'competitive',
  'Take That': 'competitive',
  'Area Control / Area Influence': 'competitive',
  'Variable Player Powers': 'asymmetric',
  'Asymmetric': 'asymmetric',
}

interface BGGLink {
  id: number
  name: string
}

interface BGGRawData {
  categoryLinks?: BGGLink[]
  mechanicLinks?: BGGLink[]
  categories?: string[]
  mechanics?: string[]
}

function getBGGThemeSlugs(bggCategories: string[]): string[] {
  const themeSlugs = new Set<string>()
  for (const cat of bggCategories) {
    if (BGG_THEME_MAP[cat]) {
      themeSlugs.add(BGG_THEME_MAP[cat])
    }
  }
  return Array.from(themeSlugs)
}

function getBGGExperienceSlugs(bggCategories: string[], bggMechanics: string[]): string[] {
  const expSlugs = new Set<string>()
  for (const cat of bggCategories) {
    if (BGG_EXPERIENCE_MAP[cat]) {
      expSlugs.add(BGG_EXPERIENCE_MAP[cat])
    }
  }
  for (const mech of bggMechanics) {
    if (BGG_EXPERIENCE_MAP[mech]) {
      expSlugs.add(BGG_EXPERIENCE_MAP[mech])
    }
  }
  return Array.from(expSlugs)
}

async function resolveBGGAliases(
  bggIds: number[],
  bggType: string,
  targetType: string
): Promise<Map<number, string>> {
  const { data, error } = await supabase
    .from('bgg_tag_aliases')
    .select('bgg_id, target_id')
    .in('bgg_id', bggIds)
    .eq('bgg_type', bggType)
    .eq('target_type', targetType)

  if (error || !data) {
    return new Map()
  }

  return new Map(data.map(alias => [alias.bgg_id, alias.target_id]))
}

async function main() {
  console.log('Starting taxonomy migration...\n')

  // Fetch all games with either bgg_raw_data OR bgg_id
  const { data: games, error: gamesError } = await supabase
    .from('games')
    .select('id, name, bgg_id, bgg_raw_data')
    .not('bgg_id', 'is', null)

  if (gamesError || !games) {
    console.error('Failed to fetch games:', gamesError)
    process.exit(1)
  }

  const gamesWithRawData = games.filter(g => g.bgg_raw_data)
  const gamesNeedingFetch = games.filter(g => !g.bgg_raw_data && g.bgg_id)

  console.log(`Found ${games.length} games with BGG IDs`)
  console.log(`  - ${gamesWithRawData.length} with cached raw data`)
  console.log(`  - ${gamesNeedingFetch.length} needing fresh BGG fetch\n`)

  // Fetch all themes and experiences
  const [{ data: themes }, { data: experiences }] = await Promise.all([
    supabase.from('themes').select('id, slug'),
    supabase.from('player_experiences').select('id, slug'),
  ])

  if (!themes || !experiences) {
    console.error('Failed to fetch taxonomy data')
    process.exit(1)
  }

  const themeBySlug = new Map(themes.map(t => [t.slug, t.id]))
  const themeById = new Map(themes.map(t => [t.id, t.slug]))
  const expBySlug = new Map(experiences.map(e => [e.slug, e.id]))
  const expById = new Map(experiences.map(e => [e.id, e.slug]))

  console.log(`Themes available: ${themes.map(t => t.slug).join(', ')}`)
  console.log(`Experiences available: ${experiences.map(e => e.slug).join(', ')}\n`)

  // Check existing links
  const gameIds = games.map(g => g.id)
  const [{ data: existingThemeLinks }, { data: existingExpLinks }] = await Promise.all([
    supabase.from('game_themes').select('game_id').in('game_id', gameIds),
    supabase.from('game_player_experiences').select('game_id').in('game_id', gameIds),
  ])

  const gamesWithThemes = new Set(existingThemeLinks?.map(l => l.game_id) || [])
  const gamesWithExps = new Set(existingExpLinks?.map(l => l.game_id) || [])

  console.log(`Games already with themes: ${gamesWithThemes.size}`)
  console.log(`Games already with experiences: ${gamesWithExps.size}\n`)

  let totalThemes = 0
  let totalExperiences = 0
  let skipped = 0
  let errors = 0

  for (const game of games) {
    // Skip if already has both
    if (gamesWithThemes.has(game.id) && gamesWithExps.has(game.id)) {
      skipped++
      continue
    }

    let categoryLinks: BGGLink[] = []
    let categories: string[] = []
    let mechanics: string[] = []

    // Try to get data from cached bgg_raw_data first
    const bggData = game.bgg_raw_data as BGGRawData
    if (bggData && (bggData.categoryLinks || bggData.categories)) {
      categoryLinks = bggData.categoryLinks || []
      categories = bggData.categories || []
      mechanics = bggData.mechanics || []
    } else if (game.bgg_id) {
      // Fetch fresh from BGG
      console.log(`  Fetching BGG data for ${game.name} (${game.bgg_id})...`)
      const freshData = await fetchBGGCategories(game.bgg_id)
      if (freshData) {
        categoryLinks = freshData.categoryLinks
        categories = freshData.categories
        mechanics = freshData.mechanics
      } else {
        console.log(`    Failed to fetch BGG data, skipping`)
        skipped++
        continue
      }
    } else {
      skipped++
      continue
    }

    let gameThemes: string[] = []
    let gameExperiences: string[] = []

    try {
      // Process themes
      if (!gamesWithThemes.has(game.id)) {
        const matchedThemeIds = new Set<string>()

        // Step 1: Resolve via alias system
        if (categoryLinks.length > 0) {
          const bggIds = categoryLinks.map(link => link.id)
          const aliasMap = await resolveBGGAliases(bggIds, 'category', 'theme')
          for (const [, targetId] of aliasMap) {
            if (themeById.has(targetId)) {
              matchedThemeIds.add(targetId)
            }
          }
        }

        // Step 2: Fall back to name-based mapping
        const themeSlugs = getBGGThemeSlugs(categories)
        for (const slug of themeSlugs) {
          if (themeBySlug.has(slug)) {
            matchedThemeIds.add(themeBySlug.get(slug)!)
          }
        }

        if (matchedThemeIds.size > 0) {
          const themeIdArray = Array.from(matchedThemeIds)
          const links = themeIdArray.map((themeId, index) => ({
            game_id: game.id,
            theme_id: themeId,
            is_primary: index === 0,
          }))

          const { error } = await supabase.from('game_themes').insert(links)
          if (error) {
            console.error(`  Error adding themes for ${game.name}:`, error.message)
            errors++
          } else {
            totalThemes += matchedThemeIds.size
            gameThemes = themeIdArray.map(id => themeById.get(id) || id)
          }
        }
      }

      // Process player experiences
      if (!gamesWithExps.has(game.id)) {
        const matchedExpIds = new Set<string>()

        // Step 1: Resolve via alias system
        if (categoryLinks.length > 0) {
          const bggIds = categoryLinks.map(link => link.id)
          const aliasMap = await resolveBGGAliases(bggIds, 'category', 'player_experience')
          for (const [, targetId] of aliasMap) {
            if (expById.has(targetId)) {
              matchedExpIds.add(targetId)
            }
          }
        }

        // Step 2: Fall back to name-based mapping
        const experienceSlugs = getBGGExperienceSlugs(categories, mechanics)
        for (const slug of experienceSlugs) {
          if (expBySlug.has(slug)) {
            matchedExpIds.add(expBySlug.get(slug)!)
          }
        }

        if (matchedExpIds.size > 0) {
          const expIdArray = Array.from(matchedExpIds)
          const links = expIdArray.map((expId, index) => ({
            game_id: game.id,
            player_experience_id: expId,
            is_primary: index === 0,
          }))

          const { error } = await supabase.from('game_player_experiences').insert(links)
          if (error) {
            console.error(`  Error adding experiences for ${game.name}:`, error.message)
            errors++
          } else {
            totalExperiences += matchedExpIds.size
            gameExperiences = expIdArray.map(id => expById.get(id) || id)
          }
        }
      }

      if (gameThemes.length > 0 || gameExperiences.length > 0) {
        console.log(`✓ ${game.name}`)
        if (gameThemes.length > 0) console.log(`    Themes: ${gameThemes.join(', ')}`)
        if (gameExperiences.length > 0) console.log(`    Experiences: ${gameExperiences.join(', ')}`)
      }
    } catch (err) {
      console.error(`  Error processing ${game.name}:`, err)
      errors++
    }
  }

  console.log('\n' + '='.repeat(50))
  console.log('Migration Complete!')
  console.log('='.repeat(50))
  console.log(`Total games processed: ${games.length}`)
  console.log(`Themes added: ${totalThemes}`)
  console.log(`Experiences added: ${totalExperiences}`)
  console.log(`Skipped (already had data): ${skipped}`)
  console.log(`Errors: ${errors}`)
}

main().catch(console.error)
