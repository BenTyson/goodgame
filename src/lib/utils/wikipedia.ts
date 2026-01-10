/**
 * Wikipedia content utilities
 * Shared cleaning and formatting for Wikipedia-sourced content
 */

/**
 * Clean Wikipedia content by removing:
 * - Citation markers [1], [2], etc.
 * - thumb| prefixes
 * - [[File:...]] patterns
 * - Wiki link syntax [[Link|Text]] → Text
 */
export function cleanWikipediaContent(content: string): string {
  return content
    .replace(/\[\d+\]/g, '')                      // Remove citation markers [1], [2], etc.
    .replace(/thumb\|/gi, '')                     // Remove thumb| prefix
    .replace(/\[\[File:[^\]]*\]\]/gi, '')         // Remove [[File:...]] patterns
    .replace(/\[\[[^\]|]*\|([^\]]*)\]\]/g, '$1')  // Convert [[Link|Text]] to Text
    .replace(/\[\[([^\]]*)\]\]/g, '$1')           // Convert [[Link]] to Link
    .trim()
}

/**
 * Clean Wikipedia content and normalize to single line
 * (collapses all whitespace)
 */
export function cleanWikipediaContentInline(content: string): string {
  return cleanWikipediaContent(content).replace(/\s+/g, ' ')
}

/**
 * Clean Wikipedia content preserving paragraph breaks
 * Returns array of paragraphs
 */
export function cleanWikipediaContentParagraphs(content: string): string[] {
  const cleaned = cleanWikipediaContent(content)
  return cleaned
    .split(/\n\n+/)
    .map(p => p.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
}

/**
 * Truncate text at word boundary
 * @param text - Text to truncate
 * @param maxLength - Maximum length before truncation
 * @param suffix - Suffix to add when truncated (default: '...')
 */
export function truncateAtWordBoundary(
  text: string,
  maxLength: number,
  suffix: string = '...'
): string {
  if (text.length <= maxLength) return text

  const lastSpace = text.lastIndexOf(' ', maxLength)
  const cutoff = lastSpace > 0 ? lastSpace : maxLength
  return text.slice(0, cutoff) + suffix
}

/**
 * Clean and truncate Wikipedia content for display
 * (common pattern for teasers/excerpts)
 */
export function cleanAndTruncateWikipedia(
  content: string,
  maxLength: number = 450
): string {
  const cleaned = cleanWikipediaContentInline(content)
  return truncateAtWordBoundary(cleaned, maxLength)
}
