/**
 * Wikidata SPARQL queries for board game awards
 *
 * Fetches award winners from Wikidata using P166 (award received)
 * with P585 (point in time) for the year and P2339 (BGG ID) for matching.
 *
 * Data is CC0 licensed (public domain).
 */

import { executeQuery, type WikidataBinding } from './client'

/**
 * Mapping from Wikidata award Q-IDs to our database slugs
 */
export const WIKIDATA_AWARD_TO_SLUG: Record<string, string> = {
  // German awards
  'Q1128609': 'spiel-des-jahres',
  'Q811416': 'kennerspiel-des-jahres',
  'Q465887': 'kinderspiel-des-jahres',
  'Q670648': 'deutscher-spiele-preis',

  // French awards
  'Q2628227': 'as-dor',

  // American awards
  'Q4806888': 'origins-awards',
  'Q5571171': 'golden-geek',

  // International
  'Q1916782': 'international-gamers-award', // Meeples' Choice -> IGA mapping
}

/**
 * Reverse mapping: slug to Q-ID
 */
export const SLUG_TO_WIKIDATA_AWARD: Record<string, string> = Object.fromEntries(
  Object.entries(WIKIDATA_AWARD_TO_SLUG).map(([qid, slug]) => [slug, qid])
)

/**
 * Award winner data from Wikidata
 */
export interface WikidataAwardWinner {
  wikidataGameId: string
  gameName: string
  bggId: number | null
  wikidataAwardId: string
  awardSlug: string | null
  year: number | null
  isNominee: boolean
}

/**
 * Extract Q-number from Wikidata URI
 */
function extractQNumber(uri: string): string {
  const match = uri.match(/Q\d+$/)
  return match ? match[0] : uri
}

/**
 * SPARQL query to fetch all board game award winners
 * Returns games with BGG IDs that have received any of the tracked awards
 */
const BOARD_GAME_AWARDS_SPARQL = `
SELECT DISTINCT
  ?game
  ?gameLabel
  ?bggId
  ?award
  ?awardLabel
  ?year
  ?isNominee
WHERE {
  # Board games (instance of or subclass of board game)
  ?game wdt:P31/wdt:P279* wd:Q131436 .

  # Has received an award
  ?game p:P166 ?awardStmt .
  ?awardStmt ps:P166 ?award .

  # Get year from point in time qualifier
  OPTIONAL {
    ?awardStmt pq:P585 ?date .
    BIND(YEAR(?date) AS ?year)
  }

  # Check if nominee (has "of" qualifier pointing to nominee category)
  OPTIONAL {
    ?awardStmt pq:P642 ?ofQualifier .
    BIND(
      IF(
        CONTAINS(LCASE(STR(?ofQualifier)), "nominee") ||
        CONTAINS(LCASE(STR(?ofQualifier)), "nominated"),
        true,
        false
      ) AS ?isNominee
    )
  }

  # Get BGG ID
  OPTIONAL { ?game wdt:P2339 ?bggId . }

  # Filter to awards we care about
  VALUES ?award {
    wd:Q1128609   # Spiel des Jahres
    wd:Q811416    # Kennerspiel des Jahres
    wd:Q465887    # Kinderspiel des Jahres
    wd:Q670648    # Deutscher Spiele Preis
    wd:Q2628227   # As d'Or
    wd:Q4806888   # Origins Award
    wd:Q5571171   # Golden Geek Award
    wd:Q1916782   # International Gamers Award / Meeples' Choice
  }

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
  }
}
ORDER BY ?award DESC(?year) ?gameLabel
`

/**
 * Parse a single binding into WikidataAwardWinner
 */
function parseAwardBinding(binding: WikidataBinding): WikidataAwardWinner {
  const gameUri = binding.game?.value || ''
  const awardUri = binding.award?.value || ''
  const wikidataAwardId = extractQNumber(awardUri)

  return {
    wikidataGameId: extractQNumber(gameUri),
    gameName: binding.gameLabel?.value || 'Unknown',
    bggId: binding.bggId?.value ? parseInt(binding.bggId.value, 10) : null,
    wikidataAwardId,
    awardSlug: WIKIDATA_AWARD_TO_SLUG[wikidataAwardId] || null,
    year: binding.year?.value ? parseInt(binding.year.value, 10) : null,
    isNominee: binding.isNominee?.value === 'true',
  }
}

/**
 * Build SPARQL query for specific awards or all awards
 */
function buildAwardsSparqlQuery(awardQIds?: string[]): string {
  const qidValues = awardQIds && awardQIds.length > 0
    ? awardQIds.map(qid => `wd:${qid}`).join(' ')
    : `wd:Q1128609 wd:Q811416 wd:Q465887 wd:Q670648 wd:Q2628227 wd:Q4806888 wd:Q5571171 wd:Q1916782`

  return `
SELECT DISTINCT
  ?game
  ?gameLabel
  ?bggId
  ?award
  ?awardLabel
  ?year
  ?isNominee
WHERE {
  ?game wdt:P31/wdt:P279* wd:Q131436 .
  ?game p:P166 ?awardStmt .
  ?awardStmt ps:P166 ?award .

  OPTIONAL {
    ?awardStmt pq:P585 ?date .
    BIND(YEAR(?date) AS ?year)
  }

  OPTIONAL {
    ?awardStmt pq:P642 ?ofQualifier .
    BIND(
      IF(
        CONTAINS(LCASE(STR(?ofQualifier)), "nominee") ||
        CONTAINS(LCASE(STR(?ofQualifier)), "nominated"),
        true,
        false
      ) AS ?isNominee
    )
  }

  OPTIONAL { ?game wdt:P2339 ?bggId . }

  VALUES ?award { ${qidValues} }

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
  }
}
ORDER BY ?award DESC(?year) ?gameLabel
`
}

/**
 * Fetch board game award winners from Wikidata
 * @param awardSlug - Optional: fetch only for a specific award
 * Returns winners/nominees for tracked awards
 */
export async function getWikidataAwardWinners(awardSlug?: string): Promise<WikidataAwardWinner[]> {
  // If specific award requested, get its Q-ID
  let awardQIds: string[] | undefined
  if (awardSlug) {
    const qid = SLUG_TO_WIKIDATA_AWARD[awardSlug]
    if (!qid) {
      console.warn(`[Wikidata Awards] No Q-ID mapping for award: ${awardSlug}`)
      return []
    }
    awardQIds = [qid]
    console.log(`[Wikidata Awards] Fetching winners for ${awardSlug} (${qid})...`)
  } else {
    console.log('[Wikidata Awards] Fetching all award winners...')
  }

  const query = buildAwardsSparqlQuery(awardQIds)
  const result = await executeQuery(query)
  const winners = result.results.bindings.map(parseAwardBinding)

  // Filter to only awards we can map to our database
  const mappedWinners = winners.filter((w) => w.awardSlug !== null)

  console.log(
    `[Wikidata Awards] Found ${winners.length} total, ${mappedWinners.length} mappable`
  )

  return mappedWinners
}

/**
 * Get award winners for a specific award
 */
export async function getWikidataAwardWinnersByAward(
  awardSlug: string
): Promise<WikidataAwardWinner[]> {
  const qid = SLUG_TO_WIKIDATA_AWARD[awardSlug]
  if (!qid) {
    console.warn(`[Wikidata Awards] No Q-ID mapping for award: ${awardSlug}`)
    return []
  }

  const query = `
SELECT DISTINCT
  ?game
  ?gameLabel
  ?bggId
  ?year
WHERE {
  ?game wdt:P31/wdt:P279* wd:Q131436 .
  ?game p:P166 ?awardStmt .
  ?awardStmt ps:P166 wd:${qid} .

  OPTIONAL {
    ?awardStmt pq:P585 ?date .
    BIND(YEAR(?date) AS ?year)
  }

  OPTIONAL { ?game wdt:P2339 ?bggId . }

  SERVICE wikibase:label {
    bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en" .
  }
}
ORDER BY DESC(?year) ?gameLabel
`

  const result = await executeQuery(query)
  return result.results.bindings.map((binding) => ({
    wikidataGameId: extractQNumber(binding.game?.value || ''),
    gameName: binding.gameLabel?.value || 'Unknown',
    bggId: binding.bggId?.value ? parseInt(binding.bggId.value, 10) : null,
    wikidataAwardId: qid,
    awardSlug,
    year: binding.year?.value ? parseInt(binding.year.value, 10) : null,
    isNominee: false, // Single award query assumes winners
  }))
}
