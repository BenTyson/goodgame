import type { ShelfStatus } from '@/types/database'

/**
 * Represents a row from a BGG collection CSV export
 */
export interface BGGCollectionRow {
  objectid: number // BGG game ID
  objectname: string // Game name
  rating: number | null // User rating 1-10, null if unrated
  status: ShelfStatus // Mapped from BGG status flags
  comment: string | null // User notes
  // Original BGG status flags for reference
  rawStatus: {
    own: boolean
    prevowned: boolean
    wanttobuy: boolean
    wanttoplay: boolean
    wishlist: boolean
  }
}

export interface ParseResult {
  rows: BGGCollectionRow[]
  errors: string[]
  warnings: string[]
}

/**
 * Required columns in BGG CSV export
 */
const REQUIRED_COLUMNS = ['objectid', 'objectname'] as const

/**
 * Status columns in BGG CSV - at least one must be true for a row to be valid
 */
const STATUS_COLUMNS = [
  'own',
  'prevowned',
  'wanttobuy',
  'wanttoplay',
  'wishlist',
] as const

/**
 * Parse a CSV string, handling quoted fields with commas and escaped quotes
 */
function parseCSVLine(line: string): string[] {
  const result: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote
          current += '"'
          i++ // Skip next quote
        } else {
          // End of quoted field
          inQuotes = false
        }
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        result.push(current.trim())
        current = ''
      } else {
        current += char
      }
    }
  }

  // Don't forget the last field
  result.push(current.trim())

  return result
}

/**
 * Convert BGG status flags to our ShelfStatus enum
 * Priority: owned > previously_owned > wishlist > want_to_play > want_to_buy
 */
function mapStatusToShelfStatus(flags: {
  own: boolean
  prevowned: boolean
  wanttobuy: boolean
  wanttoplay: boolean
  wishlist: boolean
}): ShelfStatus | null {
  // Priority order for when multiple flags are set
  if (flags.own) return 'owned'
  if (flags.prevowned) return 'previously_owned'
  if (flags.wishlist) return 'wishlist'
  if (flags.wanttoplay) return 'want_to_play'
  if (flags.wanttobuy) return 'want_to_buy'
  return null
}

/**
 * Parse a BGG rating value - handles "N/A", empty strings, and numeric values
 */
function parseRating(value: string): number | null {
  const trimmed = value.trim().toLowerCase()
  if (!trimmed || trimmed === 'n/a' || trimmed === '') {
    return null
  }

  const num = parseFloat(trimmed)
  if (isNaN(num)) {
    return null
  }

  // Clamp to valid range
  return Math.max(1, Math.min(10, num))
}

/**
 * Parse a boolean value from BGG CSV (0/1 or empty)
 */
function parseBoolean(value: string): boolean {
  return value.trim() === '1'
}

/**
 * Parse a BGG collection CSV export
 *
 * @param csvText - The raw CSV text from BGG export
 * @returns Parsed rows, errors, and warnings
 */
export function parseBGGCollectionCSV(csvText: string): ParseResult {
  const errors: string[] = []
  const warnings: string[] = []
  const rows: BGGCollectionRow[] = []

  // Normalize line endings and split
  const lines = csvText.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')

  if (lines.length < 2) {
    errors.push('CSV file is empty or has no data rows')
    return { rows, errors, warnings }
  }

  // Parse header row
  const headerLine = lines[0]
  const headers = parseCSVLine(headerLine).map((h) => h.toLowerCase())

  // Validate required columns
  for (const required of REQUIRED_COLUMNS) {
    if (!headers.includes(required)) {
      errors.push(`Missing required column: ${required}`)
    }
  }

  // Check for at least one status column
  const hasStatusColumn = STATUS_COLUMNS.some((col) => headers.includes(col))
  if (!hasStatusColumn) {
    errors.push(
      `Missing status columns. Need at least one of: ${STATUS_COLUMNS.join(', ')}`
    )
  }

  if (errors.length > 0) {
    return { rows, errors, warnings }
  }

  // Create column index map
  const colIndex: Record<string, number> = {}
  headers.forEach((header, index) => {
    colIndex[header] = index
  })

  // Parse data rows
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue // Skip empty lines

    const values = parseCSVLine(line)
    const lineNum = i + 1

    // Get required fields
    const objectidStr = values[colIndex['objectid']] || ''
    const objectid = parseInt(objectidStr, 10)

    if (isNaN(objectid) || objectid <= 0) {
      warnings.push(`Line ${lineNum}: Invalid BGG ID "${objectidStr}", skipping`)
      continue
    }

    const objectname = values[colIndex['objectname']] || ''
    if (!objectname) {
      warnings.push(`Line ${lineNum}: Missing game name for BGG ID ${objectid}, skipping`)
      continue
    }

    // Parse status flags
    const rawStatus = {
      own: parseBoolean(values[colIndex['own']] || ''),
      prevowned: parseBoolean(values[colIndex['prevowned']] || ''),
      wanttobuy: parseBoolean(values[colIndex['wanttobuy']] || ''),
      wanttoplay: parseBoolean(values[colIndex['wanttoplay']] || ''),
      wishlist: parseBoolean(values[colIndex['wishlist']] || ''),
    }

    const status = mapStatusToShelfStatus(rawStatus)
    if (!status) {
      // No status flags set - skip this row
      warnings.push(
        `Line ${lineNum}: No collection status for "${objectname}" (BGG ID ${objectid}), skipping`
      )
      continue
    }

    // Parse optional fields
    const rating = parseRating(values[colIndex['rating']] || '')
    const comment =
      colIndex['comment'] !== undefined
        ? values[colIndex['comment']] || null
        : null

    rows.push({
      objectid,
      objectname,
      rating,
      status,
      comment: comment?.trim() || null,
      rawStatus,
    })
  }

  return { rows, errors, warnings }
}

/**
 * Validate that a file appears to be a BGG collection CSV
 */
export function validateBGGCSV(csvText: string): { valid: boolean; error?: string } {
  if (!csvText || csvText.trim().length === 0) {
    return { valid: false, error: 'File is empty' }
  }

  // Check file size (5MB limit)
  const sizeInBytes = new Blob([csvText]).size
  const maxSize = 5 * 1024 * 1024 // 5MB
  if (sizeInBytes > maxSize) {
    return { valid: false, error: 'File is too large (max 5MB)' }
  }

  // Check for BGG-specific columns in header
  const firstLine = csvText.split(/[\r\n]/)[0].toLowerCase()
  if (!firstLine.includes('objectid') || !firstLine.includes('objectname')) {
    return {
      valid: false,
      error: 'This does not appear to be a BGG collection export. Missing required columns (objectid, objectname).',
    }
  }

  return { valid: true }
}
