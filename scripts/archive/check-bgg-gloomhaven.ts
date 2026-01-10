import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { fetchBGGGame } from '../src/lib/bgg/client'

async function main() {
  // Frosthaven BGG ID
  const bggId = 295770

  console.log('Fetching Gloomhaven from BGG...\n')
  const game = await fetchBGGGame(bggId)

  if (!game) {
    console.log('Game not found')
    return
  }

  console.log('Name:', game.name)
  console.log('Type:', game.type)
  console.log('Year:', game.yearPublished)

  console.log('\n=== FAMILIES ===')
  game.families?.forEach(f => console.log(`  - [${f.id}] ${f.name}`))

  console.log('\n=== EXPANSIONS (games that expand this) ===')
  game.expansions?.forEach(e => console.log(`  - [${e.id}] ${e.name}`))

  console.log('\n=== EXPANDS GAME (if this is an expansion) ===')
  if (game.expandsGame) {
    console.log(`  - [${game.expandsGame.id}] ${game.expandsGame.name}`)
  } else {
    console.log('  (none - this is a base game)')
  }

  console.log('\n=== REIMPLEMENTATIONS (games that reimplement this) ===')
  game.implementations?.forEach(i => console.log(`  - [${i.id}] ${i.name}`))

  console.log('\n=== IMPLEMENTS (if this reimplements another game) ===')
  if (game.implementsGame) {
    console.log(`  - [${game.implementsGame.id}] ${game.implementsGame.name}`)
  } else {
    console.log('  (none - this is an original)')
  }
}

main().catch(console.error)
