/**
 * Seed Games Importer
 *
 * Imports games from data/seed-games.json into the database.
 * Games are imported as unpublished (admin queue only).
 * Image URLs are stored as reference only, not displayed.
 *
 * Run with: npx tsx scripts/import-seed-games.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Type for seed game data
interface SeedGame {
  bgg_id: number;
  name: string;
  year?: number;
  min_players?: number;
  max_players?: number;
  min_playtime?: number;
  max_playtime?: number;
  playtime?: number;
  min_age?: number;
  image?: string;
  thumbnail?: string;
  designers?: string[];
  publishers?: string[];
  categories?: string[];
  mechanics?: string[];
}

/**
 * Generate URL-friendly slug from name
 */
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 100);
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
 * Upsert a designer and return their ID
 */
async function upsertDesigner(name: string): Promise<string | null> {
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

  if (error || !newDesigner) {
    console.error(`  Failed to create designer ${name}:`, error?.message);
    return null;
  }
  return newDesigner.id;
}

/**
 * Upsert a publisher and return their ID
 */
async function upsertPublisher(name: string): Promise<string | null> {
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

  if (error || !newPublisher) {
    console.error(`  Failed to create publisher ${name}:`, error?.message);
    return null;
  }
  return newPublisher.id;
}

/**
 * Link game to designers
 */
async function linkDesigners(gameId: string, designers: string[]): Promise<void> {
  for (const name of designers.slice(0, 5)) {
    const designerId = await upsertDesigner(name);
    if (designerId) {
      await supabase.from('game_designers').upsert({
        game_id: gameId,
        designer_id: designerId,
      });
    }
  }
}

/**
 * Link game to publishers
 */
async function linkPublishers(gameId: string, publishers: string[]): Promise<void> {
  for (const name of publishers.slice(0, 3)) {
    const publisherId = await upsertPublisher(name);
    if (publisherId) {
      await supabase.from('game_publishers').upsert({
        game_id: gameId,
        publisher_id: publisherId,
      });
    }
  }
}

/**
 * Import a single game
 */
async function importGame(game: SeedGame): Promise<{
  success: boolean;
  action: 'imported' | 'skipped' | 'failed';
  slug?: string;
  error?: string;
}> {
  // Check if exists by BGG ID
  const { data: existingByBgg } = await supabase
    .from('games')
    .select('id, slug')
    .eq('bgg_id', game.bgg_id)
    .single();

  if (existingByBgg) {
    return { success: true, action: 'skipped', slug: existingByBgg.slug, error: 'Already exists (BGG ID)' };
  }

  // Check if exists by slug
  const baseSlug = generateSlug(game.name);
  const { data: existingBySlug } = await supabase
    .from('games')
    .select('id, slug')
    .eq('slug', baseSlug)
    .single();

  if (existingBySlug) {
    return { success: true, action: 'skipped', slug: existingBySlug.slug, error: 'Already exists (slug)' };
  }

  // Get unique slug
  const slug = await getUniqueSlug(baseSlug);

  // Prepare game data
  const gameData = {
    slug,
    name: game.name,
    bgg_id: game.bgg_id,
    year_published: game.year,
    player_count_min: game.min_players,
    player_count_max: game.max_players,
    play_time_min: game.min_playtime,
    play_time_max: game.max_playtime || game.playtime,
    min_age: game.min_age,
    // DO NOT set image URLs - store as reference only
    box_image_url: undefined,
    thumbnail_url: undefined,
    // Store first designer/publisher in legacy fields
    designers: game.designers?.slice(0, 5) || [],
    publisher: game.publishers?.[0],
    // Import settings
    is_published: false,
    is_featured: false,
    has_score_sheet: false,
    content_status: 'none' as const,
    priority: 3,
    data_source: 'seed' as const,
    // Store reference data including image URLs (for later use)
    bgg_raw_data: {
      source: 'seed',
      imported_at: new Date().toISOString(),
      reference_images: {
        box: game.image,
        thumbnail: game.thumbnail,
      },
      categories: game.categories || [],
      mechanics: game.mechanics || [],
    },
    bgg_last_synced: new Date().toISOString(),
  };

  // Insert game
  const { data: newGame, error: insertError } = await supabase
    .from('games')
    .insert(gameData)
    .select('id, slug')
    .single();

  if (insertError || !newGame) {
    return {
      success: false,
      action: 'failed',
      error: insertError?.message || 'Insert failed',
    };
  }

  // Link designers
  if (game.designers && game.designers.length > 0) {
    await linkDesigners(newGame.id, game.designers);
  }

  // Link publishers
  if (game.publishers && game.publishers.length > 0) {
    await linkPublishers(newGame.id, game.publishers);
  }

  return { success: true, action: 'imported', slug: newGame.slug };
}

/**
 * Main import function
 */
async function main() {
  console.log('=== Seed Games Importer ===\n');
  console.log(`Target: ${supabaseUrl}\n`);

  // Load seed games
  const seedPath = path.join(process.cwd(), 'data', 'seed-games.json');

  if (!fs.existsSync(seedPath)) {
    console.error(`Seed file not found: ${seedPath}`);
    process.exit(1);
  }

  const seedData: SeedGame[] = JSON.parse(fs.readFileSync(seedPath, 'utf-8'));
  console.log(`Loaded ${seedData.length} games from seed file\n`);

  // Stats
  let imported = 0;
  let skipped = 0;
  let failed = 0;

  // Process games
  for (let i = 0; i < seedData.length; i++) {
    const game = seedData[i];
    const progress = `[${i + 1}/${seedData.length}]`;

    process.stdout.write(`${progress} ${game.name}... `);

    try {
      const result = await importGame(game);

      if (result.action === 'imported') {
        console.log(`\x1b[32mImported\x1b[0m → /${result.slug}`);
        imported++;
      } else if (result.action === 'skipped') {
        console.log(`\x1b[33mSkipped\x1b[0m (${result.error})`);
        skipped++;
      } else {
        console.log(`\x1b[31mFailed\x1b[0m: ${result.error}`);
        failed++;
      }
    } catch (error) {
      console.log(`\x1b[31mError\x1b[0m: ${error instanceof Error ? error.message : 'Unknown'}`);
      failed++;
    }

    // Small delay to not overwhelm the database
    if (i < seedData.length - 1) {
      await new Promise((r) => setTimeout(r, 50));
    }
  }

  // Summary
  console.log('\n=== Summary ===');
  console.log(`Total: ${seedData.length}`);
  console.log(`\x1b[32mImported: ${imported}\x1b[0m`);
  console.log(`\x1b[33mSkipped: ${skipped}\x1b[0m`);
  console.log(`\x1b[31mFailed: ${failed}\x1b[0m`);
  console.log('\nDone! Games are now in admin queue (unpublished).');
  console.log('Use /admin/games to review and publish.');
}

main().catch(console.error);
