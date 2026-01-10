/**
 * Test script for Wikidata integration
 *
 * Run with: npx tsx scripts/test-wikidata.ts
 */

import {
  getBoardGameCount,
  searchGameByName,
  getAwardWinningGames,
  getAllBoardGames,
} from '../src/lib/wikidata';

async function main() {
  console.log('=== Wikidata Board Game Integration Test ===\n');

  // Test 1: Get total count
  console.log('1. Getting total board game count...');
  try {
    const count = await getBoardGameCount();
    console.log(`   Found ${count.toLocaleString()} board games in Wikidata\n`);
  } catch (error) {
    console.error('   Error:', error);
  }

  // Test 2: Search for a specific game
  console.log('2. Searching for "Catan"...');
  try {
    const catanResults = await searchGameByName('Catan');
    console.log(`   Found ${catanResults.length} results:`);
    for (const game of catanResults.slice(0, 3)) {
      console.log(`   - ${game.name} (${game.yearPublished || 'unknown year'})`);
      console.log(`     Players: ${game.minPlayers || '?'}-${game.maxPlayers || '?'}`);
      console.log(`     Wikidata ID: ${game.wikidataId}`);
      console.log(`     BGG ID: ${game.bggId || 'not linked'}`);
      console.log(`     Designers: ${game.designers.join(', ') || 'unknown'}`);
    }
    console.log();
  } catch (error) {
    console.error('   Error:', error);
  }

  // Test 3: Search for another popular game
  console.log('3. Searching for "Wingspan"...');
  try {
    const wingspanResults = await searchGameByName('Wingspan');
    console.log(`   Found ${wingspanResults.length} results:`);
    for (const game of wingspanResults.slice(0, 3)) {
      console.log(`   - ${game.name} (${game.yearPublished || 'unknown year'})`);
      console.log(`     Publishers: ${game.publishers.join(', ') || 'unknown'}`);
    }
    console.log();
  } catch (error) {
    console.error('   Error:', error);
  }

  // Test 4: Get award-winning games
  console.log('4. Getting award-winning games...');
  try {
    const awardWinners = await getAwardWinningGames();
    console.log(`   Found ${awardWinners.length} award entries:`);
    for (const game of awardWinners.slice(0, 5)) {
      console.log(`   - ${game.name} (${game.awardYear}): ${game.award}`);
    }
    console.log();
  } catch (error) {
    console.error('   Error:', error);
  }

  // Test 5: Get a batch of games
  console.log('5. Getting first 10 board games...');
  try {
    const games = await getAllBoardGames();
    console.log(`   Retrieved ${games.length} games (limited to 1000)`);
    console.log('   Sample games:');
    for (const game of games.slice(0, 10)) {
      const info = [
        game.yearPublished ? `${game.yearPublished}` : 'unknown year',
        game.minPlayers && game.maxPlayers
          ? `${game.minPlayers}-${game.maxPlayers}p`
          : '',
        game.bggId ? `BGG:${game.bggId}` : '',
      ]
        .filter(Boolean)
        .join(', ');
      console.log(`   - ${game.name} (${info})`);
    }
    console.log();
  } catch (error) {
    console.error('   Error:', error);
  }

  console.log('=== Test Complete ===');
}

main().catch(console.error);
