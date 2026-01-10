/**
 * Standalone Wikidata import script
 * Uses service role client for direct database access
 *
 * Run with: npx tsx scripts/import-from-wikidata.ts
 */

import { createClient } from '@supabase/supabase-js';
import { searchGameByName, WikidataBoardGame } from '../src/lib/wikidata';
import { generateSlug } from '../src/lib/utils/slug';
import type { Database } from '../src/types/supabase';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient<Database>(supabaseUrl, supabaseServiceKey);

/**
 * Transform Wikidata to our game format
 */
function transformWikidataToGame(wikidata: WikidataBoardGame) {
  const slug = generateSlug(wikidata.name);
  const tagline = wikidata.description?.substring(0, 200);

  return {
    slug,
    name: wikidata.name,
    bgg_id: wikidata.bggId ? parseInt(wikidata.bggId, 10) : undefined,
    tagline,
    description: wikidata.description,
    box_image_url: wikidata.imageUrl,
    thumbnail_url: wikidata.imageUrl,
    player_count_min: wikidata.minPlayers,
    player_count_max: wikidata.maxPlayers,
    play_time_min: wikidata.playTimeMinutes,
    play_time_max: wikidata.playTimeMinutes,
    min_age: undefined,
    weight: undefined,
    year_published: wikidata.yearPublished,
    designers: wikidata.designers.slice(0, 5),
    publisher: wikidata.publishers[0],
    is_published: false,
    is_featured: false,
    has_score_sheet: false,
    content_status: 'none' as const,
    priority: 3,
    data_source: 'wikidata' as const,
    wikidata_id: wikidata.wikidataId,
    bgg_raw_data: {
      source: 'wikidata',
      wikidata_id: wikidata.wikidataId,
      imported_at: new Date().toISOString(),
      official_website: wikidata.officialWebsite,
    },
    bgg_last_synced: new Date().toISOString(),
  };
}

/**
 * Get unique slug (handle collisions)
 */
async function getUniqueSlug(baseSlug: string): Promise<string> {
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
 * Import a single game
 */
async function importGame(wikidata: WikidataBoardGame): Promise<{
  success: boolean;
  slug?: string;
  error?: string;
}> {
  // Check if already exists by BGG ID
  if (wikidata.bggId) {
    const { data: existingByBgg } = await supabase
      .from('games')
      .select('id, slug')
      .eq('bgg_id', parseInt(wikidata.bggId, 10))
      .single();

    if (existingByBgg) {
      return {
        success: true,
        slug: existingByBgg.slug,
        error: 'Already exists (matched by BGG ID)',
      };
    }
  }

  // Check by slug
  const baseSlug = generateSlug(wikidata.name);
  const { data: existingBySlug } = await supabase
    .from('games')
    .select('id, slug')
    .eq('slug', baseSlug)
    .single();

  if (existingBySlug) {
    return {
      success: true,
      slug: existingBySlug.slug,
      error: 'Already exists (matched by slug)',
    };
  }

  // Transform and insert
  const gameData = transformWikidataToGame(wikidata);
  gameData.slug = await getUniqueSlug(baseSlug);

  const { data: newGame, error: insertError } = await supabase
    .from('games')
    .insert(gameData)
    .select('id, slug')
    .single();

  if (insertError || !newGame) {
    return {
      success: false,
      error: insertError?.message || 'Insert failed',
    };
  }

  return {
    success: true,
    slug: newGame.slug,
  };
}

// Games to import
const TEST_GAMES = [
  'Ticket to Ride',
  'Pandemic',
  'Azul',
  '7 Wonders',
  'Scythe',
  'Terraforming Mars',
  'Codenames',
  'Splendor',
  'Dominion',
  'Gloomhaven',
];

async function main() {
  console.log('=== Wikidata Import Test ===\n');
  console.log(`Target: ${supabaseUrl}\n`);

  let imported = 0;
  let skipped = 0;
  let notFound = 0;
  let failed = 0;

  for (const name of TEST_GAMES) {
    console.log(`Searching: ${name}`);

    const results = await searchGameByName(name);

    if (results.length === 0) {
      console.log('  ❌ Not found in Wikidata\n');
      notFound++;
      continue;
    }

    // Find best match (exact name match preferred)
    const exactMatch = results.find(
      (r) => r.name.toLowerCase() === name.toLowerCase()
    );
    const game = exactMatch || results[0];

    console.log(`  Found: ${game.name} (${game.yearPublished || '?'})`);
    console.log(`  Players: ${game.minPlayers || '?'}-${game.maxPlayers || '?'}`);
    console.log(`  BGG ID: ${game.bggId || 'none'}`);

    const result = await importGame(game);

    if (result.success) {
      if (result.error) {
        console.log(`  ⏭️  Skipped: ${result.error}`);
        skipped++;
      } else {
        console.log(`  ✅ Imported: /${result.slug}`);
        imported++;
      }
    } else {
      console.log(`  ❌ Failed: ${result.error}`);
      failed++;
    }

    console.log();

    // Rate limit Wikidata queries
    await new Promise((r) => setTimeout(r, 1200));
  }

  console.log('=== Summary ===');
  console.log(`Imported: ${imported}`);
  console.log(`Skipped (already exist): ${skipped}`);
  console.log(`Not found in Wikidata: ${notFound}`);
  console.log(`Failed: ${failed}`);
}

main().catch(console.error);
