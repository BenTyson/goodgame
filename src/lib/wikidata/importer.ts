/**
 * Wikidata Game Importer
 *
 * Transforms Wikidata board game data and imports into our database.
 * Data source is CC0 licensed (public domain).
 */

import { createClient } from '@/lib/supabase/server';
import {
  WikidataBoardGame,
  searchGameByName,
  getGameByBggId,
  getAllBoardGames,
} from './client';
import { generateSlug } from '@/lib/utils/slug';
import type { Database } from '@/types/supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

type GameInsert = Database['public']['Tables']['games']['Insert'];

/**
 * Result of an import operation
 */
export interface WikidataImportResult {
  success: boolean;
  gameId?: string;
  slug?: string;
  error?: string;
  wikidataId: string;
  name: string;
  source: 'wikidata';
}

/**
 * Upsert a designer and return their ID
 */
async function upsertDesigner(
  supabase: SupabaseClient<Database>,
  name: string
): Promise<string | null> {
  const slug = generateSlug(name);

  const { data: existing } = await supabase
    .from('designers')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) return existing.id;

  const { data: newDesigner, error } = await supabase
    .from('designers')
    .insert({ slug, name })
    .select('id')
    .single();

  if (error || !newDesigner) return null;
  return newDesigner.id;
}

/**
 * Upsert a publisher and return their ID
 */
async function upsertPublisher(
  supabase: SupabaseClient<Database>,
  name: string
): Promise<string | null> {
  const slug = generateSlug(name);

  const { data: existing } = await supabase
    .from('publishers')
    .select('id')
    .eq('slug', slug)
    .single();

  if (existing) return existing.id;

  const { data: newPublisher, error } = await supabase
    .from('publishers')
    .insert({ slug, name })
    .select('id')
    .single();

  if (error || !newPublisher) return null;
  return newPublisher.id;
}

/**
 * Link game to designers in junction table
 */
async function linkGameDesigners(
  supabase: SupabaseClient<Database>,
  gameId: string,
  designerNames: string[]
): Promise<void> {
  for (const name of designerNames.slice(0, 5)) {
    const designerId = await upsertDesigner(supabase, name);
    if (designerId) {
      await supabase.from('game_designers').upsert({
        game_id: gameId,
        designer_id: designerId,
      });
    }
  }
}

/**
 * Link game to publishers in junction table
 */
async function linkGamePublishers(
  supabase: SupabaseClient<Database>,
  gameId: string,
  publisherNames: string[]
): Promise<void> {
  for (const name of publisherNames.slice(0, 3)) {
    const publisherId = await upsertPublisher(supabase, name);
    if (publisherId) {
      await supabase.from('game_publishers').upsert({
        game_id: gameId,
        publisher_id: publisherId,
      });
    }
  }
}

/**
 * Transform Wikidata data to our game insert format
 */
export function transformWikidataToGame(wikidata: WikidataBoardGame): GameInsert {
  const slug = generateSlug(wikidata.name);

  // Create a tagline from description if available
  const tagline = wikidata.description
    ? wikidata.description.substring(0, 200)
    : null;

  return {
    slug,
    name: wikidata.name,
    bgg_id: wikidata.bggId ? parseInt(wikidata.bggId, 10) : null,
    tagline,
    description: wikidata.description || null,
    // Wikidata images are usually Wikimedia Commons URLs - can be used directly
    box_image_url: wikidata.imageUrl || undefined,
    thumbnail_url: wikidata.imageUrl || undefined,
    player_count_min: wikidata.minPlayers,
    player_count_max: wikidata.maxPlayers,
    // Wikidata play time is in minutes - we store as min/max
    play_time_min: wikidata.playTimeMinutes,
    play_time_max: wikidata.playTimeMinutes, // Same value if only one provided
    min_age: undefined, // Wikidata rarely has age info
    weight: undefined, // Will be calculated by BNCS (Board Nomads Complexity Score)
    year_published: wikidata.yearPublished,
    designers: wikidata.designers.slice(0, 5),
    publisher: wikidata.publishers[0] || null,
    is_published: false, // Start unpublished
    is_featured: false,
    has_score_sheet: false,
    content_status: 'none',
    priority: 3,
    // Store Wikidata source info
    bgg_raw_data: {
      source: 'wikidata',
      wikidata_id: wikidata.wikidataId,
      imported_at: new Date().toISOString(),
      official_website: wikidata.officialWebsite || null,
    },
    bgg_last_synced: new Date().toISOString(),
  };
}

/**
 * Check for slug collision and generate unique slug
 */
async function getUniqueSlug(
  supabase: SupabaseClient<Database>,
  baseSlug: string
): Promise<string> {
  let finalSlug = baseSlug;
  let suffix = 0;

  while (true) {
    const { data: existing } = await supabase
      .from('games')
      .select('id')
      .eq('slug', finalSlug)
      .single();

    if (!existing) break;

    suffix++;
    finalSlug = `${baseSlug}-${suffix}`;
  }

  return finalSlug;
}

/**
 * Import a single game from Wikidata
 */
export async function importGameFromWikidata(
  wikidata: WikidataBoardGame
): Promise<WikidataImportResult> {
  const supabase = await createClient();

  // Check if already imported by BGG ID (if available)
  if (wikidata.bggId) {
    const { data: existingByBgg } = await supabase
      .from('games')
      .select('id, slug')
      .eq('bgg_id', parseInt(wikidata.bggId, 10))
      .single();

    if (existingByBgg) {
      return {
        success: true,
        gameId: existingByBgg.id,
        slug: existingByBgg.slug,
        wikidataId: wikidata.wikidataId,
        name: wikidata.name,
        source: 'wikidata',
        error: 'Game already exists (matched by BGG ID)',
      };
    }
  }

  // Check if already imported by name/slug
  const baseSlug = generateSlug(wikidata.name);
  const { data: existingBySlug } = await supabase
    .from('games')
    .select('id, slug')
    .eq('slug', baseSlug)
    .single();

  if (existingBySlug) {
    // Update existing game with Wikidata info if it was missing
    return {
      success: true,
      gameId: existingBySlug.id,
      slug: existingBySlug.slug,
      wikidataId: wikidata.wikidataId,
      name: wikidata.name,
      source: 'wikidata',
      error: 'Game already exists (matched by slug)',
    };
  }

  // Transform data
  const gameData = transformWikidataToGame(wikidata);

  // Get unique slug
  gameData.slug = await getUniqueSlug(supabase, baseSlug);

  // Insert game
  const { data: newGame, error: insertError } = await supabase
    .from('games')
    .insert(gameData)
    .select('id, slug')
    .single();

  if (insertError || !newGame) {
    return {
      success: false,
      wikidataId: wikidata.wikidataId,
      name: wikidata.name,
      source: 'wikidata',
      error: insertError?.message || 'Insert failed',
    };
  }

  // Link designers
  if (wikidata.designers.length > 0) {
    await linkGameDesigners(supabase, newGame.id, wikidata.designers);
  }

  // Link publishers
  if (wikidata.publishers.length > 0) {
    await linkGamePublishers(supabase, newGame.id, wikidata.publishers);
  }

  return {
    success: true,
    gameId: newGame.id,
    slug: newGame.slug,
    wikidataId: wikidata.wikidataId,
    name: wikidata.name,
    source: 'wikidata',
  };
}

/**
 * Search and import a game by name from Wikidata
 */
export async function searchAndImportByName(
  name: string
): Promise<WikidataImportResult | null> {
  const games = await searchGameByName(name);

  if (games.length === 0) {
    return null;
  }

  // Import the best match (first result)
  return importGameFromWikidata(games[0]);
}

/**
 * Import game by BGG ID, using Wikidata as the source
 */
export async function importByBggId(
  bggId: string
): Promise<WikidataImportResult | null> {
  const game = await getGameByBggId(bggId);

  if (!game) {
    return null;
  }

  return importGameFromWikidata(game);
}

/**
 * Batch import games from Wikidata
 * Returns summary of import results
 */
export async function batchImportFromWikidata(
  limit: number = 100
): Promise<{
  total: number;
  imported: number;
  skipped: number;
  failed: number;
  results: WikidataImportResult[];
}> {
  const games = await getAllBoardGames();
  const limitedGames = games.slice(0, limit);

  const results: WikidataImportResult[] = [];
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  for (const game of limitedGames) {
    try {
      const result = await importGameFromWikidata(game);
      results.push(result);

      if (result.success && !result.error) {
        imported++;
      } else if (result.error?.includes('already exists')) {
        skipped++;
      } else {
        failed++;
      }
    } catch (error) {
      failed++;
      results.push({
        success: false,
        wikidataId: game.wikidataId,
        name: game.name,
        source: 'wikidata',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }

    // Small delay between imports to be nice to our database
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return {
    total: limitedGames.length,
    imported,
    skipped,
    failed,
    results,
  };
}

/**
 * Import games that match a list of game names (for targeted import)
 * Useful for importing specific games from a "top games" list
 */
export async function importByNameList(
  names: string[]
): Promise<{
  total: number;
  found: number;
  imported: number;
  notFound: string[];
  results: WikidataImportResult[];
}> {
  const results: WikidataImportResult[] = [];
  const notFound: string[] = [];
  let found = 0;
  let imported = 0;

  for (const name of names) {
    const result = await searchAndImportByName(name);

    if (result) {
      found++;
      results.push(result);
      if (result.success && !result.error) {
        imported++;
      }
    } else {
      notFound.push(name);
    }

    // Rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1100));
  }

  return {
    total: names.length,
    found,
    imported,
    notFound,
    results,
  };
}
