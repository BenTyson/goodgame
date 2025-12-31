/**
 * Admin API for Wikidata operations
 *
 * GET /api/admin/wikidata?q=game+name - Search Wikidata
 * POST /api/admin/wikidata - Import a game from Wikidata
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  searchGameByName,
  WikidataBoardGame,
  getBoardGameCount,
} from '@/lib/wikidata';
import { generateSlug } from '@/lib/utils/slug';
import { isAdmin } from '@/lib/supabase/admin';
import type { Database } from '@/types/supabase';

// Use service role for admin operations
const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

/**
 * GET: Search Wikidata for games
 */
export async function GET(request: NextRequest) {
  // Check admin auth
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');
  const action = searchParams.get('action');

  // Get stats
  if (action === 'stats') {
    try {
      const count = await getBoardGameCount();

      // Get our import counts
      const { count: wikidataCount } = await supabaseAdmin
        .from('games')
        .select('*', { count: 'exact', head: true })
        .eq('data_source', 'wikidata');

      const { count: totalCount } = await supabaseAdmin
        .from('games')
        .select('*', { count: 'exact', head: true });

      return NextResponse.json({
        wikidata_total: count,
        imported_from_wikidata: wikidataCount || 0,
        total_games: totalCount || 0,
      });
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to get stats' },
        { status: 500 }
      );
    }
  }

  // Search
  if (!query || query.length < 2) {
    return NextResponse.json(
      { error: 'Query must be at least 2 characters' },
      { status: 400 }
    );
  }

  try {
    const results = await searchGameByName(query);

    // Check which games already exist in our database
    const enrichedResults = await Promise.all(
      results.map(async (game) => {
        let existsInDb = false;
        let existingSlug: string | null = null;

        // Check by BGG ID first
        if (game.bggId) {
          const { data } = await supabaseAdmin
            .from('games')
            .select('slug')
            .eq('bgg_id', parseInt(game.bggId, 10))
            .single();
          if (data) {
            existsInDb = true;
            existingSlug = data.slug;
          }
        }

        // Check by slug if not found by BGG ID
        if (!existsInDb) {
          const slug = generateSlug(game.name);
          const { data } = await supabaseAdmin
            .from('games')
            .select('slug')
            .eq('slug', slug)
            .single();
          if (data) {
            existsInDb = true;
            existingSlug = data.slug;
          }
        }

        return {
          ...game,
          existsInDb,
          existingSlug,
        };
      })
    );

    return NextResponse.json({ results: enrichedResults });
  } catch (error) {
    console.error('Wikidata search error:', error);
    return NextResponse.json(
      { error: 'Search failed' },
      { status: 500 }
    );
  }
}

/**
 * POST: Import a game from Wikidata
 */
export async function POST(request: NextRequest) {
  // Check admin auth
  const adminCheck = await isAdmin();
  if (!adminCheck) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const game: WikidataBoardGame = body.game;

    if (!game || !game.wikidataId || !game.name) {
      return NextResponse.json(
        { error: 'Invalid game data' },
        { status: 400 }
      );
    }

    // Check if already exists
    if (game.bggId) {
      const { data: existingByBgg } = await supabaseAdmin
        .from('games')
        .select('id, slug')
        .eq('bgg_id', parseInt(game.bggId, 10))
        .single();

      if (existingByBgg) {
        return NextResponse.json({
          success: false,
          error: 'Game already exists',
          existingSlug: existingByBgg.slug,
        });
      }
    }

    const baseSlug = generateSlug(game.name);
    const { data: existingBySlug } = await supabaseAdmin
      .from('games')
      .select('id, slug')
      .eq('slug', baseSlug)
      .single();

    if (existingBySlug) {
      return NextResponse.json({
        success: false,
        error: 'Game already exists',
        existingSlug: existingBySlug.slug,
      });
    }

    // Get unique slug
    let finalSlug = baseSlug;
    let suffix = 0;
    while (true) {
      const { data } = await supabaseAdmin
        .from('games')
        .select('id')
        .eq('slug', finalSlug)
        .single();
      if (!data) break;
      suffix++;
      finalSlug = `${baseSlug}-${suffix}`;
    }

    // Transform and insert
    const gameData = {
      slug: finalSlug,
      name: game.name,
      bgg_id: game.bggId ? parseInt(game.bggId, 10) : undefined,
      tagline: game.description?.substring(0, 200),
      description: game.description,
      box_image_url: game.imageUrl,
      thumbnail_url: game.imageUrl,
      player_count_min: game.minPlayers,
      player_count_max: game.maxPlayers,
      play_time_min: game.playTimeMinutes,
      play_time_max: game.playTimeMinutes,
      year_published: game.yearPublished,
      designers: game.designers.slice(0, 5),
      publisher: game.publishers[0],
      is_published: false,
      is_featured: false,
      has_score_sheet: false,
      content_status: 'none' as const,
      priority: 3,
      data_source: 'wikidata' as const,
      wikidata_id: game.wikidataId,
      bgg_raw_data: {
        source: 'wikidata',
        wikidata_id: game.wikidataId,
        imported_at: new Date().toISOString(),
        official_website: game.officialWebsite,
      },
      bgg_last_synced: new Date().toISOString(),
    };

    const { data: newGame, error: insertError } = await supabaseAdmin
      .from('games')
      .insert(gameData)
      .select('id, slug, name')
      .single();

    if (insertError || !newGame) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { success: false, error: insertError?.message || 'Insert failed' },
        { status: 500 }
      );
    }

    // Link designers if available
    for (const designerName of game.designers.slice(0, 5)) {
      const designerSlug = generateSlug(designerName);

      // Upsert designer
      const { data: existingDesigner } = await supabaseAdmin
        .from('designers')
        .select('id')
        .eq('slug', designerSlug)
        .single();

      let designerId = existingDesigner?.id;

      if (!designerId) {
        const { data: newDesigner } = await supabaseAdmin
          .from('designers')
          .insert({ slug: designerSlug, name: designerName })
          .select('id')
          .single();
        designerId = newDesigner?.id;
      }

      if (designerId) {
        await supabaseAdmin.from('game_designers').upsert({
          game_id: newGame.id,
          designer_id: designerId,
        });
      }
    }

    // Link publishers if available
    for (const publisherName of game.publishers.slice(0, 3)) {
      const publisherSlug = generateSlug(publisherName);

      const { data: existingPublisher } = await supabaseAdmin
        .from('publishers')
        .select('id')
        .eq('slug', publisherSlug)
        .single();

      let publisherId = existingPublisher?.id;

      if (!publisherId) {
        const { data: newPublisher } = await supabaseAdmin
          .from('publishers')
          .insert({ slug: publisherSlug, name: publisherName })
          .select('id')
          .single();
        publisherId = newPublisher?.id;
      }

      if (publisherId) {
        await supabaseAdmin.from('game_publishers').upsert({
          game_id: newGame.id,
          publisher_id: publisherId,
        });
      }
    }

    return NextResponse.json({
      success: true,
      game: newGame,
    });
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { success: false, error: 'Import failed' },
      { status: 500 }
    );
  }
}
