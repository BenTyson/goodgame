/**
 * BGG XML Parser
 *
 * Parses BGG XML API responses into structured game data.
 * Extracts only factual/public information that is legal to use.
 */

import type {
  ExtractedGame,
  BGGEntity,
  ExpansionLink,
  ImplementationLink,
  CompilationLink,
  RulebookHint,
} from './types.js'

/**
 * Simple XML attribute extractor
 */
function getAttr(element: string, attrName: string): string | null {
  const pattern = new RegExp(`${attrName}="([^"]*)"`)
  const match = element.match(pattern)
  return match ? decodeXMLEntities(match[1]) : null
}

/**
 * Decode common XML entities
 */
function decodeXMLEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, num) => String.fromCharCode(parseInt(num, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
}

/**
 * Extract text content from a simple XML element
 */
function getTextContent(xml: string, tagName: string): string | null {
  const pattern = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`)
  const match = xml.match(pattern)
  return match ? decodeXMLEntities(match[1]) : null
}

/**
 * Extract all items from BGG XML response
 */
function extractItems(xml: string): string[] {
  const items: string[] = []
  const pattern = /<item[^>]*type="boardgame"[^>]*>[\s\S]*?<\/item>/g
  let match

  while ((match = pattern.exec(xml)) !== null) {
    items.push(match[0])
  }

  return items
}

/**
 * Extract all link elements of a specific type
 */
function extractLinks(itemXml: string, linkType: string): { id: number; value: string }[] {
  const links: { id: number; value: string }[] = []
  const pattern = new RegExp(`<link[^>]*type="${linkType}"[^>]*>`, 'g')
  let match

  while ((match = pattern.exec(itemXml)) !== null) {
    const linkElement = match[0]
    const id = getAttr(linkElement, 'id')
    const value = getAttr(linkElement, 'value')

    if (id && value) {
      links.push({ id: parseInt(id, 10), value })
    }
  }

  return links
}

/**
 * Extract all name elements
 */
function extractNames(itemXml: string): { type: string; value: string }[] {
  const names: { type: string; value: string }[] = []
  const pattern = /<name[^>]*>/g
  let match

  while ((match = pattern.exec(itemXml)) !== null) {
    const nameElement = match[0]
    const type = getAttr(nameElement, 'type')
    const value = getAttr(nameElement, 'value')

    if (type && value) {
      names.push({ type, value })
    }
  }

  return names
}

/**
 * Parse a single game item from BGG XML
 */
export function parseGameItem(itemXml: string): ExtractedGame | null {
  // Extract BGG ID from item element
  const idMatch = itemXml.match(/<item[^>]*id="(\d+)"/)
  if (!idMatch) return null

  const bggId = parseInt(idMatch[1], 10)

  // Extract names
  const names = extractNames(itemXml)
  const primaryName = names.find(n => n.type === 'primary')?.value
  if (!primaryName) return null

  const alternateNames = names
    .filter(n => n.type === 'alternate')
    .map(n => n.value)

  // Extract basic attributes
  const yearMatch = itemXml.match(/<yearpublished[^>]*value="(-?\d+)"/)
  const minPlayersMatch = itemXml.match(/<minplayers[^>]*value="(\d+)"/)
  const maxPlayersMatch = itemXml.match(/<maxplayers[^>]*value="(\d+)"/)
  const minPlaytimeMatch = itemXml.match(/<minplaytime[^>]*value="(\d+)"/)
  const maxPlaytimeMatch = itemXml.match(/<maxplaytime[^>]*value="(\d+)"/)
  const minAgeMatch = itemXml.match(/<minage[^>]*value="(\d+)"/)

  // Extract images
  const imageUrl = getTextContent(itemXml, 'image')
  const thumbnailUrl = getTextContent(itemXml, 'thumbnail')

  // Extract entities with BGG IDs
  const designers: BGGEntity[] = extractLinks(itemXml, 'boardgamedesigner')
    .map(link => ({ bgg_id: link.id, name: link.value }))

  const publishers: BGGEntity[] = extractLinks(itemXml, 'boardgamepublisher')
    .map(link => ({ bgg_id: link.id, name: link.value }))

  const artists: BGGEntity[] = extractLinks(itemXml, 'boardgameartist')
    .map(link => ({ bgg_id: link.id, name: link.value }))

  const categories: BGGEntity[] = extractLinks(itemXml, 'boardgamecategory')
    .map(link => ({ bgg_id: link.id, name: link.value }))

  const mechanics: BGGEntity[] = extractLinks(itemXml, 'boardgamemechanic')
    .map(link => ({ bgg_id: link.id, name: link.value }))

  const families: BGGEntity[] = extractLinks(itemXml, 'boardgamefamily')
    .map(link => ({ bgg_id: link.id, name: link.value }))

  const integrations: BGGEntity[] = extractLinks(itemXml, 'boardgameintegration')
    .map(link => ({ bgg_id: link.id, name: link.value }))

  // Extract expansion relationships
  const expansions: ExpansionLink[] = []
  const expansionLinks = extractLinks(itemXml, 'boardgameexpansion')

  for (const link of expansionLinks) {
    // Check if this is "expands" or "expanded_by" by looking at inbound attribute
    const linkPattern = new RegExp(
      `<link[^>]*type="boardgameexpansion"[^>]*id="${link.id}"[^>]*>`
    )
    const linkMatch = itemXml.match(linkPattern)

    if (linkMatch) {
      const inbound = getAttr(linkMatch[0], 'inbound')
      expansions.push({
        bgg_id: link.id,
        name: link.value,
        direction: inbound === 'true' ? 'expanded_by' : 'expands',
      })
    }
  }

  // Extract implementation relationships
  const implementations: ImplementationLink[] = []
  const implLinks = extractLinks(itemXml, 'boardgameimplementation')

  for (const link of implLinks) {
    const linkPattern = new RegExp(
      `<link[^>]*type="boardgameimplementation"[^>]*id="${link.id}"[^>]*>`
    )
    const linkMatch = itemXml.match(linkPattern)

    if (linkMatch) {
      const inbound = getAttr(linkMatch[0], 'inbound')
      implementations.push({
        bgg_id: link.id,
        name: link.value,
        direction: inbound === 'true' ? 'reimplemented_by' : 'reimplements',
      })
    }
  }

  // Extract compilation relationships
  const compilations: CompilationLink[] = []
  const compLinks = extractLinks(itemXml, 'boardgamecompilation')

  for (const link of compLinks) {
    const linkPattern = new RegExp(
      `<link[^>]*type="boardgamecompilation"[^>]*id="${link.id}"[^>]*>`
    )
    const linkMatch = itemXml.match(linkPattern)

    if (linkMatch) {
      const inbound = getAttr(linkMatch[0], 'inbound')
      compilations.push({
        bgg_id: link.id,
        name: link.value,
        direction: inbound === 'true' ? 'contained_in' : 'contains',
      })
    }
  }

  return {
    bgg_id: bggId,
    name: primaryName,
    alternate_names: alternateNames,
    year_published: yearMatch ? parseInt(yearMatch[1], 10) : null,
    min_players: minPlayersMatch ? parseInt(minPlayersMatch[1], 10) : null,
    max_players: maxPlayersMatch ? parseInt(maxPlayersMatch[1], 10) : null,
    min_playtime: minPlaytimeMatch ? parseInt(minPlaytimeMatch[1], 10) : null,
    max_playtime: maxPlaytimeMatch ? parseInt(maxPlaytimeMatch[1], 10) : null,
    min_age: minAgeMatch ? parseInt(minAgeMatch[1], 10) : null,
    image_url: imageUrl,
    thumbnail_url: thumbnailUrl,
    designers,
    publishers,
    artists,
    categories,
    mechanics,
    expansions,
    implementations,
    families,
    integrations,
    compilations,
    rulebook_hints: [], // Populated separately via files page fetch
    extracted_at: new Date().toISOString(),
  }
}

/**
 * Parse all games from BGG XML API response
 */
export function parseGamesXml(xml: string): ExtractedGame[] {
  const items = extractItems(xml)
  const games: ExtractedGame[] = []

  for (const itemXml of items) {
    const game = parseGameItem(itemXml)
    if (game) {
      games.push(game)
    }
  }

  return games
}

/**
 * Parse rulebook hints from files page HTML
 */
export function parseRulebookHintsFromHtml(html: string): RulebookHint[] {
  const hints: RulebookHint[] = []

  // Pattern to find PDF filenames in file listings
  // Look for rulebook-related PDFs
  const patterns = [
    />([\w\-_]+(?:rulebook|rules|regeln|manual|instructions|reglas|regle)[^\s<>]*\.pdf)</gi,
    /href="[^"]*\/([\w\-_]+(?:rulebook|rules|regeln|manual|instructions|reglas|regle)[^\s"]*\.pdf)"/gi,
  ]

  for (const pattern of patterns) {
    let match
    while ((match = pattern.exec(html)) !== null) {
      const filename = match[1]

      // Skip if we already have this filename
      if (hints.some(h => h.filename === filename)) continue

      // Determine language from filename
      let language: string | undefined
      if (/[-_](en|eng|english)/i.test(filename)) language = 'en'
      else if (/[-_](de|deu|german|deutsch)/i.test(filename)) language = 'de'
      else if (/[-_](fr|fra|french|francais)/i.test(filename)) language = 'fr'
      else if (/[-_](es|esp|spanish|espanol)/i.test(filename)) language = 'es'
      else if (/[-_](it|ita|italian|italiano)/i.test(filename)) language = 'it'
      else if (/[-_](pl|pol|polish)/i.test(filename)) language = 'pl'
      else if (/[-_](pt|por|portuguese)/i.test(filename)) language = 'pt'
      else if (/[-_](nl|dutch|nederlands)/i.test(filename)) language = 'nl'
      else if (/[-_](ja|jp|japanese)/i.test(filename)) language = 'ja'
      else if (/[-_](zh|cn|chinese)/i.test(filename)) language = 'zh'

      // Determine type from filename
      let type: 'rulebook' | 'faq' | 'reference' | 'other' = 'rulebook'
      if (/faq|errata|correction/i.test(filename)) type = 'faq'
      else if (/reference|summary|aid|quick|cheat/i.test(filename)) type = 'reference'

      hints.push({ filename, language, type })
    }
  }

  return hints
}
