import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

import { executeQuery } from '../src/lib/wikidata/client'

/**
 * Query Wikidata for game relationships
 *
 * Key properties:
 * - P155: follows (this game is a sequel TO)
 * - P156: followed by (this game HAS sequel)
 * - P179: part of the series
 * - P144: based on
 * - P4969: derivative work
 * - P527: has part (expansions)
 * - P361: part of (inverse - this is expansion OF)
 */

async function getGameRelationships(bggId: string) {
  const query = `
    SELECT DISTINCT
      ?game
      ?gameLabel
      ?bggId
      ?followsLabel
      ?followsBggId
      ?followedByLabel
      ?followedByBggId
      ?seriesLabel
      ?basedOnLabel
      ?basedOnBggId
      ?derivativeLabel
      ?derivativeBggId
      ?hasPartLabel
      ?hasPartBggId
      ?partOfLabel
      ?partOfBggId
    WHERE {
      ?game wdt:P2339 "${bggId}" .

      # This game follows (is sequel to)
      OPTIONAL {
        ?game wdt:P155 ?follows .
        OPTIONAL { ?follows wdt:P2339 ?followsBggId . }
      }

      # This game is followed by (has sequel)
      OPTIONAL {
        ?game wdt:P156 ?followedBy .
        OPTIONAL { ?followedBy wdt:P2339 ?followedByBggId . }
      }

      # Part of series
      OPTIONAL { ?game wdt:P179 ?series . }

      # Based on
      OPTIONAL {
        ?game wdt:P144 ?basedOn .
        OPTIONAL { ?basedOn wdt:P2339 ?basedOnBggId . }
      }

      # Derivative work (things based on this)
      OPTIONAL {
        ?game wdt:P4969 ?derivative .
        OPTIONAL { ?derivative wdt:P2339 ?derivativeBggId . }
      }

      # Has part (expansions of this game)
      OPTIONAL {
        ?game wdt:P527 ?hasPart .
        OPTIONAL { ?hasPart wdt:P2339 ?hasPartBggId . }
      }

      # Part of (this is expansion of)
      OPTIONAL {
        ?game wdt:P361 ?partOf .
        OPTIONAL { ?partOf wdt:P2339 ?partOfBggId . }
      }

      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    }
    LIMIT 50
  `

  console.log(`Querying Wikidata for BGG ID: ${bggId}...\n`)

  try {
    const result = await executeQuery(query)
    return result.results.bindings
  } catch (error) {
    console.error('Query error:', error)
    return []
  }
}

async function getSeriesMembers(seriesName: string) {
  const query = `
    SELECT DISTINCT
      ?game
      ?gameLabel
      ?bggId
      ?yearPublished
    WHERE {
      ?game wdt:P31/wdt:P279* wd:Q131436 .
      ?game wdt:P179 ?series .
      ?series rdfs:label ?seriesLabel .
      FILTER(CONTAINS(LCASE(?seriesLabel), LCASE("${seriesName}")))

      OPTIONAL { ?game wdt:P2339 ?bggId . }
      OPTIONAL { ?game wdt:P571 ?inception . BIND(YEAR(?inception) AS ?yearPublished) }

      SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
    }
    ORDER BY ?yearPublished
    LIMIT 50
  `

  console.log(`\nQuerying for "${seriesName}" series members...\n`)

  try {
    const result = await executeQuery(query)
    return result.results.bindings
  } catch (error) {
    console.error('Query error:', error)
    return []
  }
}

async function main() {
  // Gloomhaven BGG ID
  const gloomhavenBggId = '174430'

  console.log('=== GLOOMHAVEN WIKIDATA RELATIONSHIPS ===\n')

  const relationships = await getGameRelationships(gloomhavenBggId)

  if (relationships.length === 0) {
    console.log('No game found with this BGG ID in Wikidata')
    console.log('Trying Frosthaven instead...\n')

    // Try Frosthaven
    const frosthaven = await getGameRelationships('295770')
    if (frosthaven.length > 0) {
      console.log('Frosthaven found!')
      frosthaven.forEach(binding => {
        console.log('\nGame:', binding.gameLabel?.value)
        if (binding.followsLabel?.value) {
          console.log('  Follows (sequel to):', binding.followsLabel.value, binding.followsBggId?.value ? `(BGG: ${binding.followsBggId.value})` : '')
        }
        if (binding.seriesLabel?.value) {
          console.log('  Part of series:', binding.seriesLabel.value)
        }
        if (binding.partOfLabel?.value) {
          console.log('  Part of:', binding.partOfLabel.value, binding.partOfBggId?.value ? `(BGG: ${binding.partOfBggId.value})` : '')
        }
      })
    }
  } else {
    relationships.forEach(binding => {
      console.log('Game:', binding.gameLabel?.value)
      console.log('BGG ID:', binding.bggId?.value)

      if (binding.followsLabel?.value) {
        console.log('  Follows (sequel to):', binding.followsLabel.value, binding.followsBggId?.value ? `(BGG: ${binding.followsBggId.value})` : '')
      }
      if (binding.followedByLabel?.value) {
        console.log('  Followed by (has sequel):', binding.followedByLabel.value, binding.followedByBggId?.value ? `(BGG: ${binding.followedByBggId.value})` : '')
      }
      if (binding.seriesLabel?.value) {
        console.log('  Part of series:', binding.seriesLabel.value)
      }
      if (binding.basedOnLabel?.value) {
        console.log('  Based on:', binding.basedOnLabel.value, binding.basedOnBggId?.value ? `(BGG: ${binding.basedOnBggId.value})` : '')
      }
      if (binding.derivativeLabel?.value) {
        console.log('  Has derivative:', binding.derivativeLabel.value, binding.derivativeBggId?.value ? `(BGG: ${binding.derivativeBggId.value})` : '')
      }
      if (binding.hasPartLabel?.value) {
        console.log('  Has part (expansion):', binding.hasPartLabel.value, binding.hasPartBggId?.value ? `(BGG: ${binding.hasPartBggId.value})` : '')
      }
      if (binding.partOfLabel?.value) {
        console.log('  Part of:', binding.partOfLabel.value, binding.partOfBggId?.value ? `(BGG: ${binding.partOfBggId.value})` : '')
      }
    })
  }

  // Check for series members
  console.log('\n\n=== GLOOMHAVEN SERIES MEMBERS ===')
  const seriesMembers = await getSeriesMembers('Gloomhaven')

  if (seriesMembers.length > 0) {
    console.log(`Found ${seriesMembers.length} games in series:\n`)
    seriesMembers.forEach(binding => {
      console.log(`  - ${binding.gameLabel?.value} (${binding.yearPublished?.value || '?'})`,
        binding.bggId?.value ? `[BGG: ${binding.bggId.value}]` : '[no BGG ID]')
    })
  } else {
    console.log('No series found')
  }
}

main().catch(console.error)
