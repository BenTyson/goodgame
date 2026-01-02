import { config } from 'dotenv'
config({ path: '.env.local' })

import { enrichPublisher, getGameByBggId } from '../src/lib/wikidata'
import { fetchBGGGame } from '../src/lib/bgg'

async function test() {
  const bggId = parseInt(process.argv[2] || '138161', 10)

  console.log(`Fetching BGG data for ID: ${bggId}`)
  console.log('='.repeat(60))

  const bggData = await fetchBGGGame(bggId)

  if (!bggData) {
    console.log('Game not found on BGG')
    return
  }

  console.log(`\nGame: ${bggData.name}`)
  console.log(`Year: ${bggData.yearPublished}`)
  console.log(`Players: ${bggData.minPlayers}-${bggData.maxPlayers}`)
  console.log(`Play Time: ${bggData.playingTime} min`)

  // Test game-level Wikidata enrichment
  console.log('\n' + '='.repeat(60))
  console.log('Testing game-level Wikidata enrichment:')
  console.log('='.repeat(60))

  const wikidataGame = await getGameByBggId(String(bggId))

  if (wikidataGame) {
    console.log(`\n✓ Found on Wikidata: ${wikidataGame.name}`)
    console.log(`  Wikidata ID: ${wikidataGame.wikidataId}`)
    console.log(`  Year: ${wikidataGame.yearPublished || '(none)'}`)
    console.log(`  Players: ${wikidataGame.minPlayers || '?'}-${wikidataGame.maxPlayers || '?'}`)
    console.log(`  Play Time: ${wikidataGame.playTimeMinutes || '(none)'} min`)
    console.log(`  Image: ${wikidataGame.imageUrl ? '✓ CC-licensed image available' : '(none)'}`)
    console.log(`  Website: ${wikidataGame.officialWebsite || '(none)'}`)

    // Check for discrepancies
    const discrepancies: string[] = []
    if (bggData.yearPublished && wikidataGame.yearPublished && bggData.yearPublished !== wikidataGame.yearPublished) {
      discrepancies.push(`Year: BGG=${bggData.yearPublished}, Wikidata=${wikidataGame.yearPublished}`)
    }
    if (bggData.minPlayers && wikidataGame.minPlayers && bggData.minPlayers !== wikidataGame.minPlayers) {
      discrepancies.push(`MinPlayers: BGG=${bggData.minPlayers}, Wikidata=${wikidataGame.minPlayers}`)
    }
    if (bggData.maxPlayers && wikidataGame.maxPlayers && bggData.maxPlayers !== wikidataGame.maxPlayers) {
      discrepancies.push(`MaxPlayers: BGG=${bggData.maxPlayers}, Wikidata=${wikidataGame.maxPlayers}`)
    }

    if (discrepancies.length > 0) {
      console.log('\n  ⚠️  Discrepancies found:')
      discrepancies.forEach(d => console.log(`    - ${d}`))
    } else {
      console.log('\n  ✓ No discrepancies between sources')
    }
  } else {
    console.log(`\n✗ Game not found on Wikidata`)
  }

  // Test publisher enrichment
  const publishers = bggData.publishers || []
  console.log('\n' + '='.repeat(60))
  console.log(`Testing publisher enrichment (${publishers.length} publishers):`)
  console.log('='.repeat(60))

  for (const pubName of publishers.slice(0, 3)) {
    console.log(`\nSearching for: "${pubName}"`)

    try {
      const wikidata = await enrichPublisher(pubName)
      if (wikidata?.website) {
        console.log(`  ✓ Found website: ${wikidata.website}`)
      } else if (wikidata) {
        console.log(`  ~ Found on Wikidata but no website`)
      } else {
        console.log(`  ✗ Not found`)
      }
    } catch (err) {
      console.log(`  ✗ Error: ${err}`)
    }

    await new Promise((r) => setTimeout(r, 500))
  }

  console.log('\n' + '='.repeat(60))
  console.log('Test complete!')
}

test().catch(console.error)
