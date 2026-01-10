import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { getGameByBggId, getGamesInSeries } from '../src/lib/wikidata'

async function main() {
  // Gloomhaven BGG ID
  const bggId = '174430'

  console.log('=== TESTING WIKIDATA ENRICHMENT ===\n')
  console.log(`Looking up Gloomhaven (BGG ID: ${bggId})...\n`)

  const game = await getGameByBggId(bggId)

  if (!game) {
    console.log('No game found!')
    return
  }

  console.log('Game:', game.name)
  console.log('Wikidata ID:', game.wikidataId)
  console.log('BGG ID:', game.bggId)
  console.log('')
  console.log('=== NEW FIELDS ===')
  console.log('Wikipedia URL:', game.wikipediaUrl || '(none)')
  console.log('Series ID:', game.seriesId || '(none)')
  console.log('Series Name:', game.seriesName || '(none)')
  console.log('')
  console.log('=== SEQUEL RELATIONSHIPS ===')
  console.log('Follows (sequel to):', game.followsName || '(none)')
  console.log('  - Follows BGG ID:', game.followsBggId || '(none)')
  console.log('Followed by (has sequel):', game.followedByName || '(none)')
  console.log('  - Followed by BGG ID:', game.followedByBggId || '(none)')

  // If there's a series, get all members
  if (game.seriesId) {
    console.log('\n=== SERIES MEMBERS ===')
    const members = await getGamesInSeries(game.seriesId)
    console.log(`Found ${members.length} games in "${game.seriesName}" series:`)
    for (const member of members) {
      console.log(`  - ${member.name} (${member.yearPublished || '?'})`, member.bggId ? `[BGG: ${member.bggId}]` : '')
    }
  }

  // Also test Frosthaven to check sequel relations
  console.log('\n\n=== TESTING FROSTHAVEN ===')
  const frosthaven = await getGameByBggId('295770')
  if (frosthaven) {
    console.log('Game:', frosthaven.name)
    console.log('Wikidata ID:', frosthaven.wikidataId)
    console.log('Wikipedia URL:', frosthaven.wikipediaUrl || '(none)')
    console.log('Follows (sequel to):', frosthaven.followsName || '(none)')
    console.log('  - Follows BGG ID:', frosthaven.followsBggId || '(none)')
  }
}

main().catch(console.error)
