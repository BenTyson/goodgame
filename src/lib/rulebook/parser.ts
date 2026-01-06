/**
 * Rulebook PDF Parser
 * Extracts text content from PDF rulebooks for AI processing
 */

import { extractText, getMeta } from 'unpdf'
import type { ParsedPDF, ParsedTextStructured, RulebookSectionType, StructuredSection } from './types'

/**
 * Fetch and parse a PDF from a URL
 */
export async function parsePdfFromUrl(url: string): Promise<ParsedPDF> {
  const startTime = Date.now()

  // Fetch PDF as buffer
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch PDF: ${response.status} ${response.statusText}`)
  }

  const arrayBuffer = await response.arrayBuffer()

  return parsePdfFromBuffer(arrayBuffer, startTime)
}

/**
 * Parse a PDF from an ArrayBuffer
 */
export async function parsePdfFromBuffer(
  buffer: ArrayBuffer | Buffer,
  startTime: number = Date.now()
): Promise<ParsedPDF> {
  // Convert Buffer to Uint8Array for unpdf compatibility
  const data = buffer instanceof Buffer
    ? new Uint8Array(buffer)
    : new Uint8Array(buffer)

  // Extract text using unpdf
  const { text, totalPages } = await extractText(data, { mergePages: true })

  // Get document info
  let metadata: ParsedPDF['metadata'] = {}
  try {
    const info = await getMeta(data)
    metadata = {
      title: info.info?.Title as string | undefined,
      author: info.info?.Author as string | undefined,
      creator: info.info?.Creator as string | undefined,
      producer: info.info?.Producer as string | undefined,
    }
  } catch {
    // Metadata extraction can fail for some PDFs, continue without it
  }

  const cleanedText = cleanPdfText(text)
  const wordCount = countWords(cleanedText)
  const processingTimeMs = Date.now() - startTime

  return {
    text: cleanedText,
    pageCount: totalPages,
    wordCount,
    metadata,
    extractedAt: new Date(),
    processingTimeMs,
  }
}

/**
 * Clean extracted PDF text
 * - Remove excessive whitespace
 * - Fix common PDF extraction issues
 * - Normalize line breaks
 */
function cleanPdfText(text: string): string {
  return text
    // Normalize line endings
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    // Remove page headers/footers (common patterns)
    .replace(/^Page \d+ of \d+$/gm, '')
    .replace(/^\d+\s*$/gm, '') // Standalone page numbers
    // Fix hyphenated words at line breaks
    .replace(/(\w)-\n(\w)/g, '$1$2')
    // Collapse multiple newlines
    .replace(/\n{3,}/g, '\n\n')
    // Collapse multiple spaces
    .replace(/ {2,}/g, ' ')
    // Trim lines
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()
}

/**
 * Count words in text
 */
function countWords(text: string): number {
  return text.split(/\s+/).filter(word => word.length > 0).length
}

/**
 * Extract sections from rulebook text
 * Attempts to identify major sections based on formatting
 */
export function extractSections(text: string): Array<{ title: string; content: string }> {
  const sections: Array<{ title: string; content: string }> = []

  // Common section headers in rulebooks
  const sectionPatterns = [
    /^(OVERVIEW|INTRODUCTION|ABOUT THE GAME)/im,
    /^(COMPONENTS?|GAME CONTENTS?|WHAT'S IN THE BOX)/im,
    /^(SET ?UP|SETUP|GETTING STARTED|BEFORE YOU PLAY)/im,
    /^(HOW TO PLAY|GAMEPLAY|PLAYING THE GAME|GAME PLAY)/im,
    /^(TURN STRUCTURE|YOUR TURN|ON YOUR TURN|TAKING A TURN)/im,
    /^(ACTIONS?|AVAILABLE ACTIONS|WHAT YOU CAN DO)/im,
    /^(SCORING|END ?GAME|GAME END|WINNING|VICTORY)/im,
    /^(VARIANTS?|ADVANCED RULES|OPTIONAL RULES)/im,
    /^(FAQ|FREQUENTLY ASKED|CLARIFICATIONS?)/im,
    /^(GLOSSARY|TERMS|DEFINITIONS)/im,
  ]

  // Split by likely section headers (ALL CAPS lines or numbered sections)
  const lines = text.split('\n')
  let currentSection = { title: 'Introduction', content: '' }

  for (const line of lines) {
    // Check if this line is a section header
    const isHeader = sectionPatterns.some(pattern => pattern.test(line)) ||
      (line === line.toUpperCase() && line.length > 3 && line.length < 50 && /^[A-Z]/.test(line))

    if (isHeader) {
      // Save current section if it has content
      if (currentSection.content.trim()) {
        sections.push({
          title: currentSection.title,
          content: currentSection.content.trim(),
        })
      }
      // Start new section
      currentSection = { title: line.trim(), content: '' }
    } else {
      currentSection.content += line + '\n'
    }
  }

  // Don't forget the last section
  if (currentSection.content.trim()) {
    sections.push({
      title: currentSection.title,
      content: currentSection.content.trim(),
    })
  }

  return sections
}

/**
 * Find component list in rulebook text
 * Returns raw text that likely contains component information
 */
export function findComponentsSection(text: string): string | null {
  const sections = extractSections(text)

  const componentSection = sections.find(s =>
    /component|content|what's in|included/i.test(s.title)
  )

  if (componentSection) {
    return componentSection.content
  }

  // Fallback: search for numbered lists with component-like items
  const componentPattern = /(\d+)\s*(cards?|dice|tokens?|boards?|tiles?|meeples?|cubes?|miniatures?|pieces?)/gi
  const matches = text.match(componentPattern)

  if (matches && matches.length > 3) {
    // Find the paragraph containing these matches
    const paragraphs = text.split(/\n\n+/)
    for (const p of paragraphs) {
      const matchCount = (p.match(componentPattern) || []).length
      if (matchCount >= 3) {
        return p
      }
    }
  }

  return null
}

/**
 * Estimate rulebook complexity based on text metrics
 * This is a simple heuristic before AI analysis
 */
export function estimateComplexityFromMetrics(pdf: ParsedPDF): {
  estimate: number
  factors: {
    rulebookLength: 'short' | 'medium' | 'long' | 'very_long'
    wordDensity: 'low' | 'medium' | 'high'
  }
} {
  // Word count ranges for complexity
  let rulebookLength: 'short' | 'medium' | 'long' | 'very_long'
  if (pdf.wordCount < 2000) {
    rulebookLength = 'short'
  } else if (pdf.wordCount < 5000) {
    rulebookLength = 'medium'
  } else if (pdf.wordCount < 10000) {
    rulebookLength = 'long'
  } else {
    rulebookLength = 'very_long'
  }

  // Words per page (density)
  const wordsPerPage = pdf.wordCount / pdf.pageCount
  let wordDensity: 'low' | 'medium' | 'high'
  if (wordsPerPage < 200) {
    wordDensity = 'low' // Lots of images/diagrams
  } else if (wordsPerPage < 400) {
    wordDensity = 'medium'
  } else {
    wordDensity = 'high' // Text-heavy
  }

  // Simple estimate (will be refined by AI)
  let estimate = 2.5 // Start at middle
  if (rulebookLength === 'short') estimate -= 0.5
  if (rulebookLength === 'long') estimate += 0.5
  if (rulebookLength === 'very_long') estimate += 1.0
  if (wordDensity === 'high') estimate += 0.3
  if (wordDensity === 'low') estimate -= 0.2

  // Clamp to valid range
  estimate = Math.max(1.0, Math.min(5.0, estimate))

  return {
    estimate: Math.round(estimate * 10) / 10,
    factors: { rulebookLength, wordDensity },
  }
}

// =====================================================
// Enhanced Text Cleaning & Structuring
// For AI Q&A feature - cleaner, categorized sections
// =====================================================

/**
 * Deep clean PDF text - removes artifacts, fixes encoding issues
 * More aggressive than cleanPdfText for better AI processing
 */
export function deepCleanPdfText(text: string): { cleanedText: string; cleaningApplied: string[] } {
  const cleaningApplied: string[] = []
  let result = text

  // 1. Normalize line endings
  result = result.replace(/\r\n/g, '\n').replace(/\r/g, '\n')
  cleaningApplied.push('line_endings')

  // 2. Fix PDF ligatures (common in professionally typeset documents)
  const ligatureMap: Record<string, string> = {
    'ﬁ': 'fi',
    'ﬂ': 'fl',
    'ﬀ': 'ff',
    'ﬃ': 'ffi',
    'ﬄ': 'ffl',
    'ﬅ': 'st',
    'ﬆ': 'st',
  }
  let hadLigatures = false
  for (const [ligature, replacement] of Object.entries(ligatureMap)) {
    if (result.includes(ligature)) {
      result = result.split(ligature).join(replacement)
      hadLigatures = true
    }
  }
  if (hadLigatures) cleaningApplied.push('ligatures')

  // 3. Remove zero-width characters
  const zeroWidthBefore = result.length
  result = result.replace(/[\u200B-\u200D\uFEFF\u00AD]/g, '')
  if (result.length !== zeroWidthBefore) cleaningApplied.push('zero_width')

  // 4. Fix smart quotes and apostrophes
  const smartQuotesBefore = result
  result = result
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")  // Single quotes
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')  // Double quotes
    .replace(/[\u2032]/g, "'")  // Prime
    .replace(/[\u2033]/g, '"')  // Double prime
  if (result !== smartQuotesBefore) cleaningApplied.push('smart_quotes')

  // 5. Normalize dashes
  const dashesBefore = result
  result = result
    .replace(/[\u2013\u2014\u2015]/g, '-')  // En dash, em dash, horizontal bar
    .replace(/\u2212/g, '-')  // Minus sign
  if (result !== dashesBefore) cleaningApplied.push('dashes')

  // 6. Fix bullet points and list markers
  const bulletsBefore = result
  result = result
    .replace(/[\u2022\u2023\u2043\u204C\u204D\u2219\u25AA\u25AB\u25CF\u25CB\u25A0\u25A1\u25B8\u25B9\u25BA\u25BB]/g, '-')
    .replace(/[\u2666\u2665\u2663\u2660]/g, '-')  // Card suits used as bullets
  if (result !== bulletsBefore) cleaningApplied.push('bullets')

  // 7. Remove control characters (except newline and tab)
  const controlBefore = result.length
  result = result.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
  if (result.length !== controlBefore) cleaningApplied.push('control_chars')

  // 8. Normalize Unicode whitespace
  const whitespaceBefore = result
  result = result.replace(/[\u00A0\u1680\u2000-\u200A\u202F\u205F\u3000]/g, ' ')
  if (result !== whitespaceBefore) cleaningApplied.push('unicode_whitespace')

  // 9. Remove page headers/footers (enhanced patterns)
  result = result
    .replace(/^Page \d+ of \d+$/gm, '')
    .replace(/^\d+\s*$/gm, '')  // Standalone page numbers
    .replace(/^©.*$/gm, '')  // Copyright lines
    .replace(/^www\..*$/gm, '')  // URLs on their own lines

  // 10. Fix hyphenated words at line breaks
  result = result.replace(/(\w)-\n(\w)/g, '$1$2')
  cleaningApplied.push('hyphenation')

  // 11. Fix broken sentences (period followed by lowercase with no space)
  result = result.replace(/\.([a-z])/g, '. $1')

  // 12. Collapse excessive whitespace
  result = result
    .replace(/\n{3,}/g, '\n\n')  // Max 2 newlines
    .replace(/ {2,}/g, ' ')  // Max 1 space
    .replace(/\t+/g, ' ')  // Tabs to spaces
  cleaningApplied.push('whitespace')

  // 13. Trim lines and final result
  result = result
    .split('\n')
    .map(line => line.trim())
    .join('\n')
    .trim()

  return { cleanedText: result, cleaningApplied }
}

/**
 * Map a section title to a standard section type
 */
export function categorizeSection(title: string): RulebookSectionType {
  const normalized = title.toLowerCase().trim()

  // Overview/Introduction
  if (/^(overview|introduction|about|welcome|game\s*overview)/i.test(normalized)) {
    return 'overview'
  }

  // Components
  if (/^(components?|contents?|what'?s?\s*in|included|game\s*materials?|inventory)/i.test(normalized)) {
    return 'components'
  }

  // Setup
  if (/^(set\s*up|setup|getting\s*started|before\s*you\s*play|preparation|preparing)/i.test(normalized)) {
    return 'setup'
  }

  // Gameplay (general)
  if (/^(how\s*to\s*play|gameplay|playing|game\s*play|rules\s*of\s*play)/i.test(normalized)) {
    return 'gameplay'
  }

  // Turn structure
  if (/^(turn|your\s*turn|on\s*your\s*turn|taking\s*a\s*turn|turn\s*structure|phases?|round)/i.test(normalized)) {
    return 'turns'
  }

  // Actions
  if (/^(actions?|available\s*actions|what\s*you\s*can\s*do|player\s*actions)/i.test(normalized)) {
    return 'actions'
  }

  // Scoring/End game
  if (/^(scoring|end\s*game|game\s*end|winning|victory|final\s*scoring|endgame)/i.test(normalized)) {
    return 'scoring'
  }

  // Variants
  if (/^(variants?|advanced|optional|alternative|solo|two\s*player|expansion)/i.test(normalized)) {
    return 'variants'
  }

  // Glossary
  if (/^(glossary|terms|definitions|key\s*terms|terminology|iconography|symbols)/i.test(normalized)) {
    return 'glossary'
  }

  // FAQ
  if (/^(faq|frequently\s*asked|questions|clarifications?|q\s*&\s*a)/i.test(normalized)) {
    return 'faq'
  }

  return 'other'
}

/**
 * Parse PDF text into structured, categorized sections
 * Main function for creating ParsedTextStructured
 */
export function parseStructuredRulebook(rawText: string): ParsedTextStructured {
  // Deep clean the text
  const { cleanedText, cleaningApplied } = deepCleanPdfText(rawText)

  // Extract sections from cleaned text
  const rawSections = extractSections(cleanedText)

  // Categorize and structure sections
  const sections: StructuredSection[] = rawSections.map(section => ({
    type: categorizeSection(section.title),
    title: section.title,
    content: section.content,
    wordCount: countWords(section.content),
  }))

  // Calculate totals
  const totalWords = countWords(cleanedText)
  const totalSections = sections.length

  return {
    version: 1,
    cleanedText,
    sections,
    metadata: {
      totalSections,
      totalWords,
      cleaningApplied,
    },
  }
}
