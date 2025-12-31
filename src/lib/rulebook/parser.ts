/**
 * Rulebook PDF Parser
 * Extracts text content from PDF rulebooks for AI processing
 */

import { PDFParse } from 'pdf-parse'
import type { ParsedPDF } from './types'

/**
 * Fetch and parse a PDF from a URL
 */
export async function parsePdfFromUrl(url: string): Promise<ParsedPDF> {
  const startTime = Date.now()

  // Create parser with URL
  const parser = new PDFParse({ url })

  // Get text content
  const textResult = await parser.getText()

  // Get document info
  const infoResult = await parser.getInfo()

  const text = cleanPdfText(textResult.text)
  const wordCount = countWords(text)
  const processingTimeMs = Date.now() - startTime

  // Clean up
  await parser.destroy()

  return {
    text,
    pageCount: textResult.total, // Use total for page count
    wordCount,
    metadata: {
      title: infoResult.info?.Title,
      author: infoResult.info?.Author,
      creator: infoResult.info?.Creator,
      producer: infoResult.info?.Producer,
    },
    extractedAt: new Date(),
    processingTimeMs,
  }
}

/**
 * Parse a PDF from a Buffer
 */
export async function parsePdfFromBuffer(
  buffer: Buffer,
  startTime: number = Date.now()
): Promise<ParsedPDF> {
  // Create parser with data buffer
  const parser = new PDFParse({ data: buffer })

  // Get text content
  const textResult = await parser.getText()

  // Get document info
  const infoResult = await parser.getInfo()

  const text = cleanPdfText(textResult.text)
  const wordCount = countWords(text)
  const processingTimeMs = Date.now() - startTime

  // Clean up
  await parser.destroy()

  return {
    text,
    pageCount: textResult.total, // Use total for page count
    wordCount,
    metadata: {
      title: infoResult.info?.Title,
      author: infoResult.info?.Author,
      creator: infoResult.info?.Creator,
      producer: infoResult.info?.Producer,
    },
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
