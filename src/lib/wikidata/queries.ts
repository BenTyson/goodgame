/**
 * Wikidata SPARQL queries for board game data
 *
 * Key Wikidata properties for board games:
 * - P31: instance of (Q131436 = board game)
 * - P1872: minimum number of players
 * - P1873: maximum number of players
 * - P2047: duration/playing time
 * - P571: inception (year published)
 * - P287: designed by
 * - P123: publisher
 * - P18: image
 * - P856: official website
 * - P953: full work available at URL (rulebook PDF)
 * - P973: described at URL (info page)
 * - P2339: BoardGameGeek ID
 * - P166: award received
 *
 * Query endpoint: https://query.wikidata.org/sparql
 */

/**
 * Get all board games with basic metadata
 * Returns: name, year, min/max players, play time, designers, publishers
 */
export const BOARD_GAMES_QUERY = `
SELECT DISTINCT
  ?game
  ?gameLabel
  ?gameDescription
  ?yearPublished
  ?minPlayers
  ?maxPlayers
  ?playTime
  ?image
  ?officialWebsite
  ?bggId
  (GROUP_CONCAT(DISTINCT ?designerLabel; separator=", ") AS ?designers)
  (GROUP_CONCAT(DISTINCT ?publisherLabel; separator=", ") AS ?publishers)
WHERE {
  # Instance of board game or subclass
  ?game wdt:P31/wdt:P279* wd:Q131436 .

  # Optional: Year published (inception)
  OPTIONAL { ?game wdt:P571 ?inception . BIND(YEAR(?inception) AS ?yearPublished) }

  # Optional: Player counts
  OPTIONAL { ?game wdt:P1872 ?minPlayers . }
  OPTIONAL { ?game wdt:P1873 ?maxPlayers . }

  # Optional: Playing time (duration in minutes)
  OPTIONAL { ?game wdt:P2047 ?playTime . }

  # Optional: Image
  OPTIONAL { ?game wdt:P18 ?image . }

  # Optional: Official website
  OPTIONAL { ?game wdt:P856 ?officialWebsite . }

  # Optional: BoardGameGeek ID
  OPTIONAL { ?game wdt:P2339 ?bggId . }

  # Optional: Designers
  OPTIONAL {
    ?game wdt:P287 ?designer .
    ?designer rdfs:label ?designerLabel .
    FILTER(LANG(?designerLabel) = "en")
  }

  # Optional: Publishers
  OPTIONAL {
    ?game wdt:P123 ?publisher .
    ?publisher rdfs:label ?publisherLabel .
    FILTER(LANG(?publisherLabel) = "en")
  }

  # Get labels and descriptions
  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
GROUP BY ?game ?gameLabel ?gameDescription ?yearPublished ?minPlayers ?maxPlayers ?playTime ?image ?officialWebsite ?bggId
ORDER BY DESC(?yearPublished)
LIMIT 1000
`;

/**
 * Search for a specific game by name
 */
export const GAME_BY_NAME_QUERY = `
SELECT DISTINCT
  ?game
  ?gameLabel
  ?gameDescription
  ?yearPublished
  ?minPlayers
  ?maxPlayers
  ?playTime
  ?image
  ?officialWebsite
  ?bggId
  (GROUP_CONCAT(DISTINCT ?designerLabel; separator=", ") AS ?designers)
  (GROUP_CONCAT(DISTINCT ?publisherLabel; separator=", ") AS ?publishers)
WHERE {
  ?game wdt:P31/wdt:P279* wd:Q131436 .
  ?game rdfs:label ?gameLabel .
  FILTER(LANG(?gameLabel) = "en")
  FILTER(CONTAINS(LCASE(?gameLabel), LCASE("$GAME_NAME")))

  OPTIONAL { ?game wdt:P571 ?inception . BIND(YEAR(?inception) AS ?yearPublished) }
  OPTIONAL { ?game wdt:P1872 ?minPlayers . }
  OPTIONAL { ?game wdt:P1873 ?maxPlayers . }
  OPTIONAL { ?game wdt:P2047 ?playTime . }
  OPTIONAL { ?game wdt:P18 ?image . }
  OPTIONAL { ?game wdt:P856 ?officialWebsite . }
  OPTIONAL { ?game wdt:P2339 ?bggId . }

  OPTIONAL {
    ?game wdt:P287 ?designer .
    ?designer rdfs:label ?designerLabel .
    FILTER(LANG(?designerLabel) = "en")
  }

  OPTIONAL {
    ?game wdt:P123 ?publisher .
    ?publisher rdfs:label ?publisherLabel .
    FILTER(LANG(?publisherLabel) = "en")
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
GROUP BY ?game ?gameLabel ?gameDescription ?yearPublished ?minPlayers ?maxPlayers ?playTime ?image ?officialWebsite ?bggId
LIMIT 10
`;

/**
 * Get games that have won major awards
 * - Spiel des Jahres (Q1128609)
 * - Deutscher Spiele Preis (Q670648)
 * - Meeples' Choice Award (Q1916782)
 */
export const AWARD_WINNING_GAMES_QUERY = `
SELECT DISTINCT
  ?game
  ?gameLabel
  ?gameDescription
  ?yearPublished
  ?awardLabel
  ?awardYear
  ?bggId
WHERE {
  ?game wdt:P31/wdt:P279* wd:Q131436 .
  ?game p:P166 ?awardStatement .
  ?awardStatement ps:P166 ?award .
  ?awardStatement pq:P585 ?awardDate .
  BIND(YEAR(?awardDate) AS ?awardYear)

  # Filter to major board game awards
  VALUES ?award {
    wd:Q1128609   # Spiel des Jahres
    wd:Q670648    # Deutscher Spiele Preis
    wd:Q1916782   # Meeples' Choice Award
    wd:Q2628227   # As d'Or
    wd:Q4806888   # Origins Award
  }

  OPTIONAL { ?game wdt:P571 ?inception . BIND(YEAR(?inception) AS ?yearPublished) }
  OPTIONAL { ?game wdt:P2339 ?bggId . }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
ORDER BY DESC(?awardYear)
LIMIT 500
`;

/**
 * Get games by BGG ID (for cross-referencing)
 */
export const GAME_BY_BGG_ID_QUERY = `
SELECT DISTINCT
  ?game
  ?gameLabel
  ?gameDescription
  ?yearPublished
  ?minPlayers
  ?maxPlayers
  ?playTime
  ?image
  ?officialWebsite
  ?rulebookUrl
  ?bggId
  (GROUP_CONCAT(DISTINCT ?designerLabel; separator=", ") AS ?designers)
  (GROUP_CONCAT(DISTINCT ?publisherLabel; separator=", ") AS ?publishers)
WHERE {
  ?game wdt:P31/wdt:P279* wd:Q131436 .
  ?game wdt:P2339 "$BGG_ID" .

  OPTIONAL { ?game wdt:P571 ?inception . BIND(YEAR(?inception) AS ?yearPublished) }
  OPTIONAL { ?game wdt:P1872 ?minPlayers . }
  OPTIONAL { ?game wdt:P1873 ?maxPlayers . }
  OPTIONAL { ?game wdt:P2047 ?playTime . }
  OPTIONAL { ?game wdt:P18 ?image . }
  OPTIONAL { ?game wdt:P856 ?officialWebsite . }
  OPTIONAL { ?game wdt:P953 ?rulebookUrl . }
  OPTIONAL { ?game wdt:P2339 ?bggId . }

  OPTIONAL {
    ?game wdt:P287 ?designer .
    ?designer rdfs:label ?designerLabel .
    FILTER(LANG(?designerLabel) = "en")
  }

  OPTIONAL {
    ?game wdt:P123 ?publisher .
    ?publisher rdfs:label ?publisherLabel .
    FILTER(LANG(?publisherLabel) = "en")
  }

  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
GROUP BY ?game ?gameLabel ?gameDescription ?yearPublished ?minPlayers ?maxPlayers ?playTime ?image ?officialWebsite ?rulebookUrl ?bggId
LIMIT 1
`;

/**
 * Get count of board games in Wikidata
 */
export const BOARD_GAME_COUNT_QUERY = `
SELECT (COUNT(DISTINCT ?game) AS ?count)
WHERE {
  ?game wdt:P31/wdt:P279* wd:Q131436 .
}
`;

/**
 * Get games with mechanics (using genre property P136)
 * Note: Wikidata uses P136 (genre) for game mechanics
 */
export const GAMES_WITH_MECHANICS_QUERY = `
SELECT DISTINCT
  ?game
  ?gameLabel
  ?mechanicLabel
WHERE {
  ?game wdt:P31/wdt:P279* wd:Q131436 .
  ?game wdt:P136 ?mechanic .

  SERVICE wikibase:label { bd:serviceParam wikibase:language "[AUTO_LANGUAGE],en". }
}
LIMIT 500
`;

/**
 * Helper to build query with variable substitution
 */
export function buildQuery(
  template: string,
  variables: Record<string, string>
): string {
  let query = template;
  for (const [key, value] of Object.entries(variables)) {
    // Escape special SPARQL characters in the value
    const escapedValue = value.replace(/["\\]/g, '\\$&');
    query = query.replace(new RegExp(`\\$${key}`, 'g'), escapedValue);
  }
  return query;
}
