/**
 * Slug Generation Utility
 *
 * Generates URL-safe slugs from strings.
 * Used for game names, publishers, families, etc.
 */

/**
 * Generate a URL-safe slug from a string
 *
 * Features:
 * - Converts to lowercase
 * - Removes apostrophes (e.g., "7 Wonders: Duel" → "7-wonders-duel")
 * - Replaces & with 'and' (e.g., "Ticket & Ride" → "ticket-and-ride")
 * - Replaces non-alphanumeric characters with hyphens
 * - Collapses multiple hyphens
 * - Trims leading/trailing hyphens
 *
 * @param name - The string to convert to a slug
 * @returns URL-safe slug
 *
 * @example
 * generateSlug("Catan: Seafarers")  // "catan-seafarers"
 * generateSlug("7 Wonders: Duel")   // "7-wonders-duel"
 * generateSlug("Ticket & Ride")     // "ticket-and-ride"
 * generateSlug("It's a Wonderful World")  // "its-a-wonderful-world"
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/['']/g, '')           // Remove apostrophes
    .replace(/[&]/g, 'and')         // Replace & with 'and'
    .replace(/[^a-z0-9]+/g, '-')    // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '')        // Trim leading/trailing hyphens
    .replace(/-+/g, '-')            // Collapse multiple hyphens
}
