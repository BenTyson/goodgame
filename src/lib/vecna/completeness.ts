/**
 * Vecna Pipeline - Data Completeness Report
 *
 * Analyzes a game after import/enrichment/parsing/content-gen to identify
 * what data is MISSING. Used to:
 * 1. Show admins what gaps need manual filling
 * 2. Identify areas where the content generator can improve
 */

import type { VecnaGame, RulesContent, SetupContent, ReferenceContent } from './types'

// Importance level for missing fields
export type FieldImportance = 'critical' | 'important' | 'recommended' | 'optional'

// Individual field status
export interface FieldStatus {
  field: string
  label: string
  present: boolean
  importance: FieldImportance
  source?: string // Which pipeline stage should populate this
  note?: string   // Additional context
}

// Category of fields
export interface FieldCategory {
  name: string
  description: string
  icon: string // lucide icon name
  fields: FieldStatus[]
  completionPercent: number
  criticalMissing: number
  importantMissing: number
}

// Complete report
export interface CompletenessReport {
  gameId: string
  gameName: string
  generatedAt: string

  // Overall stats
  overallPercent: number
  totalFields: number
  presentFields: number

  // By importance
  criticalMissing: FieldStatus[]
  importantMissing: FieldStatus[]
  recommendedMissing: FieldStatus[]

  // By category
  categories: FieldCategory[]

  // Summary for UI
  summary: {
    status: 'complete' | 'needs_attention' | 'incomplete'
    message: string
  }
}

// =====================================================
// Field Definitions
// =====================================================

function checkCoreData(game: VecnaGame): FieldStatus[] {
  // Player count - both min and max should be present
  const hasPlayerCount = game.player_count_min !== null && game.player_count_max !== null
  const playerCountNote = hasPlayerCount
    ? `${game.player_count_min}-${game.player_count_max} players`
    : game.player_count_min !== null
      ? `Min only: ${game.player_count_min}`
      : game.player_count_max !== null
        ? `Max only: ${game.player_count_max}`
        : undefined

  // Play time - both min and max should be present
  const hasPlayTime = game.play_time_min !== null && game.play_time_max !== null
  const playTimeNote = hasPlayTime
    ? `${game.play_time_min}-${game.play_time_max} min`
    : game.play_time_min !== null
      ? `Min only: ${game.play_time_min}`
      : game.play_time_max !== null
        ? `Max only: ${game.play_time_max}`
        : undefined

  return [
    {
      field: 'name',
      label: 'Game Name',
      present: !!game.name,
      importance: 'critical',
      source: 'import',
    },
    {
      field: 'year_published',
      label: 'Year Published',
      present: game.year_published !== null,
      importance: 'important',
      source: 'import',
    },
    {
      field: 'description',
      label: 'Description',
      present: !!game.description && game.description.length > 50,
      importance: 'important',
      source: 'import',
      note: game.description ? `${game.description.length} chars` : undefined,
    },
    {
      field: 'player_count',
      label: 'Player Count',
      present: hasPlayerCount,
      importance: 'critical',
      source: 'import',
      note: playerCountNote,
    },
    {
      field: 'play_time',
      label: 'Play Time',
      present: hasPlayTime,
      importance: 'important',
      source: 'import',
      note: playTimeNote,
    },
    {
      field: 'weight',
      label: 'BGG Weight',
      present: game.weight !== null,
      importance: 'recommended',
      source: 'import',
      note: 'Used for complexity reference',
    },
    {
      field: 'min_age',
      label: 'Minimum Age',
      present: game.min_age !== null,
      importance: 'recommended',
      source: 'import',
    },
  ]
}

function checkExternalSources(game: VecnaGame): FieldStatus[] {
  // BGG data - both ID and raw data should be present
  const hasBggData = game.bgg_id !== null && game.bgg_raw_data !== null

  return [
    // BGG
    {
      field: 'bgg_data',
      label: 'BGG Data',
      present: hasBggData,
      importance: 'critical',
      source: 'import',
      note: game.bgg_id ? `ID: ${game.bgg_id}` : undefined,
    },
    // Wikidata
    {
      field: 'wikidata_id',
      label: 'Wikidata ID',
      present: !!game.wikidata_id,
      importance: 'recommended',
      source: 'enrichment',
    },
    {
      field: 'wikidata_image_url',
      label: 'Wikidata Image (CC)',
      present: !!game.wikidata_image_url,
      importance: 'recommended',
      source: 'enrichment',
      note: 'CC-licensed image for public use',
    },
    {
      field: 'official_website',
      label: 'Official Website',
      present: !!game.official_website,
      importance: 'optional',
      source: 'enrichment',
    },
    // Wikipedia
    {
      field: 'wikipedia_url',
      label: 'Wikipedia URL',
      present: !!game.wikipedia_url,
      importance: 'recommended',
      source: 'enrichment',
    },
    {
      field: 'wikipedia_summary',
      label: 'Wikipedia Summary',
      present: game.wikipedia_summary !== null && Object.keys(game.wikipedia_summary).length > 0,
      importance: 'recommended',
      source: 'enrichment',
    },
    {
      field: 'wikipedia_gameplay',
      label: 'Wikipedia Gameplay',
      present: !!game.wikipedia_gameplay,
      importance: 'recommended',
      source: 'enrichment',
      note: 'Helps AI generate better content',
    },
    {
      field: 'wikipedia_infobox',
      label: 'Wikipedia Infobox',
      present: game.wikipedia_infobox !== null && Object.keys(game.wikipedia_infobox).length > 0,
      importance: 'optional',
      source: 'enrichment',
    },
    {
      field: 'wikipedia_origins',
      label: 'Origins/History',
      present: !!game.wikipedia_origins && game.wikipedia_origins.length > 50,
      importance: 'important',
      source: 'enrichment',
      note: game.wikipedia_origins ? `${game.wikipedia_origins.length} chars` : 'Background story for the game',
    },
    {
      field: 'wikipedia_reception',
      label: 'Reception/Reviews',
      present: !!game.wikipedia_reception && game.wikipedia_reception.length > 50,
      importance: 'important',
      source: 'enrichment',
      note: game.wikipedia_reception ? `${game.wikipedia_reception.length} chars` : 'Critical acclaim and reviews',
    },
    {
      field: 'wikipedia_awards',
      label: 'Wikipedia Awards',
      present: game.wikipedia_awards !== null && game.wikipedia_awards.length > 0,
      importance: 'recommended',
      source: 'enrichment',
      note: game.wikipedia_awards ? `${game.wikipedia_awards.length} awards` : undefined,
    },
    // Amazon
    {
      field: 'amazon_asin',
      label: 'Amazon ASIN',
      present: !!game.amazon_asin,
      importance: 'recommended',
      source: 'enrichment',
      note: game.amazon_asin ? `ASIN: ${game.amazon_asin}` : 'For Buy on Amazon button',
    },
  ]
}

function checkRulebookParsing(game: VecnaGame): FieldStatus[] {
  return [
    {
      field: 'rulebook_url',
      label: 'Rulebook URL',
      present: !!game.rulebook_url,
      importance: 'critical',
      source: 'enrichment/manual',
      note: game.rulebook_source ? `Source: ${game.rulebook_source}` : undefined,
    },
    {
      field: 'crunch_score',
      label: 'Crunch Score',
      present: game.crunch_score !== null,
      importance: 'important',
      source: 'parsing',
      note: game.crunch_score ? `Score: ${game.crunch_score.toFixed(1)}/10` : undefined,
    },
  ]
}

function checkTaxonomy(game: VecnaGame): FieldStatus[] {
  const categoryCount = game.categories.length
  const mechanicCount = game.mechanics.length
  const themeCount = game.themes.length
  const playerExperienceCount = game.player_experiences.length

  return [
    {
      field: 'categories',
      label: 'Categories',
      present: categoryCount >= 1,
      importance: 'critical',
      source: 'import/ai',
      note: categoryCount > 0 ? `${categoryCount} assigned` : 'None assigned',
    },
    {
      field: 'mechanics',
      label: 'Mechanics',
      present: mechanicCount >= 2,
      importance: 'important',
      source: 'import/ai',
      note: mechanicCount > 0 ? `${mechanicCount} assigned` : 'None assigned',
    },
    {
      field: 'themes',
      label: 'Themes',
      present: themeCount >= 1,
      importance: 'recommended',
      source: 'import/ai',
      note: themeCount > 0 ? `${themeCount} assigned` : 'None assigned',
    },
    {
      field: 'player_experiences',
      label: 'Player Experiences',
      present: playerExperienceCount >= 1,
      importance: 'important',
      source: 'import/manual',
      note: playerExperienceCount > 0
        ? `${playerExperienceCount} assigned (${game.player_experiences.map(pe => pe.name).join(', ')})`
        : 'None assigned (Competitive, Cooperative, Solo, etc.)',
    },
  ]
}

function checkRulesContent(content: RulesContent | null): FieldStatus[] {
  if (!content) {
    return [
      {
        field: 'rules_content',
        label: 'Rules Content',
        present: false,
        importance: 'critical',
        source: 'generation',
        note: 'No rules content generated',
      },
    ]
  }

  return [
    {
      field: 'rules_quickStart',
      label: 'Quick Start Guide',
      present: !!content.quickStart && content.quickStart.length >= 3,
      importance: 'critical',
      source: 'generation',
      note: content.quickStart ? `${content.quickStart.length} points` : undefined,
    },
    {
      field: 'rules_coreRules',
      label: 'Core Rules',
      present: !!content.coreRules && content.coreRules.length >= 2,
      importance: 'important',
      source: 'generation',
      note: content.coreRules ? `${content.coreRules.length} sections` : undefined,
    },
    {
      field: 'rules_turnStructure',
      label: 'Turn Structure',
      present: !!content.turnStructure && content.turnStructure.length >= 1,
      importance: 'important',
      source: 'generation',
      note: content.turnStructure ? `${content.turnStructure.length} phases` : undefined,
    },
    {
      field: 'rules_winCondition',
      label: 'Win Condition',
      present: !!content.winCondition && content.winCondition.length > 10,
      importance: 'critical',
      source: 'generation',
    },
    {
      field: 'rules_endGameConditions',
      label: 'End Game Conditions',
      present: !!content.endGameConditions && content.endGameConditions.length >= 1,
      importance: 'important',
      source: 'generation',
    },
    {
      field: 'rules_tips',
      label: 'Strategy Tips',
      present: !!content.tips && content.tips.length >= 2,
      importance: 'recommended',
      source: 'generation',
      note: content.tips ? `${content.tips.length} tips` : undefined,
    },
  ]
}

function checkSetupContent(content: SetupContent | null): FieldStatus[] {
  if (!content) {
    return [
      {
        field: 'setup_content',
        label: 'Setup Content',
        present: false,
        importance: 'critical',
        source: 'generation',
        note: 'No setup content generated',
      },
    ]
  }

  return [
    {
      field: 'setup_steps',
      label: 'Setup Steps',
      present: !!content.steps && content.steps.length >= 3,
      importance: 'critical',
      source: 'generation',
      note: content.steps ? `${content.steps.length} steps` : undefined,
    },
    {
      field: 'setup_components',
      label: 'Component List',
      present: !!content.components && content.components.length >= 3,
      importance: 'important',
      source: 'generation',
      note: content.components ? `${content.components.length} components` : undefined,
    },
    {
      field: 'setup_estimatedTime',
      label: 'Setup Time',
      present: !!content.estimatedTime,
      importance: 'recommended',
      source: 'generation',
      note: content.estimatedTime || undefined,
    },
    {
      field: 'setup_playerSetup',
      label: 'Player Setup',
      present: !!content.playerSetup && content.playerSetup.length > 10,
      importance: 'important',
      source: 'generation',
    },
    {
      field: 'setup_firstPlayerRule',
      label: 'First Player Rule',
      present: !!content.firstPlayerRule,
      importance: 'recommended',
      source: 'generation',
    },
    {
      field: 'setup_quickTips',
      label: 'Quick Tips',
      present: !!content.quickTips && content.quickTips.length >= 2,
      importance: 'optional',
      source: 'generation',
      note: content.quickTips ? `${content.quickTips.length} tips` : undefined,
    },
    {
      field: 'setup_commonMistakes',
      label: 'Common Mistakes',
      present: !!content.commonMistakes && content.commonMistakes.length >= 1,
      importance: 'optional',
      source: 'generation',
      note: content.commonMistakes ? `${content.commonMistakes.length} items` : undefined,
    },
  ]
}

function checkReferenceContent(content: ReferenceContent | null): FieldStatus[] {
  if (!content) {
    return [
      {
        field: 'reference_content',
        label: 'Reference Content',
        present: false,
        importance: 'critical',
        source: 'generation',
        note: 'No reference content generated',
      },
    ]
  }

  // Check for endGame - can be string or object
  let hasEndGame = false
  if (content.endGame) {
    if (typeof content.endGame === 'string') {
      hasEndGame = content.endGame.length > 10
    } else {
      hasEndGame = !!(content.endGame.winner || (content.endGame.triggers && content.endGame.triggers.length > 0))
    }
  }

  return [
    {
      field: 'reference_turnSummary',
      label: 'Turn Summary',
      present: !!content.turnSummary && content.turnSummary.length >= 1,
      importance: 'important',
      source: 'generation',
      note: content.turnSummary ? `${content.turnSummary.length} phases` : undefined,
    },
    {
      field: 'reference_keyActions',
      label: 'Key Actions',
      present: !!content.keyActions && content.keyActions.length >= 2,
      importance: 'important',
      source: 'generation',
      note: content.keyActions ? `${content.keyActions.length} actions` : undefined,
    },
    {
      field: 'reference_importantRules',
      label: 'Important Rules',
      present: !!content.importantRules && content.importantRules.length >= 2,
      importance: 'recommended',
      source: 'generation',
      note: content.importantRules ? `${content.importantRules.length} rules` : undefined,
    },
    {
      field: 'reference_endGame',
      label: 'End Game Summary',
      present: hasEndGame,
      importance: 'critical',
      source: 'generation',
    },
    {
      field: 'reference_scoringSummary',
      label: 'Scoring Summary',
      present: !!content.scoringSummary && content.scoringSummary.length >= 1,
      importance: 'recommended',
      source: 'generation',
      note: content.scoringSummary ? `${content.scoringSummary.length} categories` : undefined,
    },
  ]
}

function checkPublisherData(game: VecnaGame): FieldStatus[] {
  // Check BGG publishers
  const bggPublishers = game.bgg_raw_data?.publishers || []
  const hasBggPublishers = bggPublishers.length > 0

  // Check Wikipedia infobox for publishers with region
  const wikiPublishers = game.wikipedia_infobox?.publishersWithRegion || []
  const hasWikiPublishers = wikiPublishers.length > 0

  // Find primary publisher (isPrimary is set by infobox.ts, prioritizing US publishers)
  const primaryPublisher = wikiPublishers.find(p => p.isPrimary)
  const hasPrimaryPublisher = !!primaryPublisher
  const primaryPublisherName = primaryPublisher?.name
  const primaryPublisherRegion = primaryPublisher?.region

  return [
    {
      field: 'publishers',
      label: 'Publishers Listed',
      present: hasBggPublishers || hasWikiPublishers,
      importance: 'important',
      source: 'import/enrichment',
      note: hasBggPublishers
        ? `${bggPublishers.length} from BGG`
        : hasWikiPublishers
          ? `${wikiPublishers.length} from Wikipedia`
          : undefined,
    },
    {
      field: 'primary_publisher',
      label: 'Primary Publisher',
      present: hasPrimaryPublisher,
      importance: 'critical',
      source: 'enrichment',
      note: primaryPublisherName
        ? `${primaryPublisherName}${primaryPublisherRegion ? ` (${primaryPublisherRegion})` : ''}`
        : 'Not designated',
    },
    {
      field: 'publisher_regions',
      label: 'Regional Publishers',
      present: wikiPublishers.filter(p => p.region).length >= 2,
      importance: 'recommended',
      source: 'enrichment',
      note: wikiPublishers.filter(p => p.region).length > 0
        ? `${wikiPublishers.filter(p => p.region).length} regions`
        : 'No regional data',
    },
  ]
}

function checkImages(game: VecnaGame): FieldStatus[] {
  return [
    {
      field: 'thumbnail_url',
      label: 'Thumbnail Image',
      present: !!game.thumbnail_url,
      importance: 'critical',
      source: 'import',
    },
    {
      field: 'box_image_url',
      label: 'Box Art Image',
      present: !!game.box_image_url,
      importance: 'important',
      source: 'manual/enrichment',
      note: 'High-res box art for game page',
    },
    {
      field: 'hero_image_url',
      label: 'Hero Image',
      present: !!game.hero_image_url,
      importance: 'recommended',
      source: 'manual',
      note: '16:9 hero for featured displays',
    },
    {
      field: 'wikidata_image',
      label: 'CC-Licensed Image',
      present: !!game.wikidata_image_url,
      importance: 'recommended',
      source: 'enrichment',
      note: 'Legally safe image from Wikidata',
    },
  ]
}

// =====================================================
// Report Generation
// =====================================================

function calculateCategoryStats(fields: FieldStatus[]): { completionPercent: number; criticalMissing: number; importantMissing: number } {
  const present = fields.filter(f => f.present).length
  const total = fields.length
  const criticalMissing = fields.filter(f => !f.present && f.importance === 'critical').length
  const importantMissing = fields.filter(f => !f.present && f.importance === 'important').length

  return {
    completionPercent: total > 0 ? Math.round((present / total) * 100) : 100,
    criticalMissing,
    importantMissing,
  }
}

export function generateCompletenessReport(game: VecnaGame): CompletenessReport {
  // Collect all field checks
  const coreData = checkCoreData(game)
  const externalSources = checkExternalSources(game)
  const rulebookParsing = checkRulebookParsing(game)
  const taxonomy = checkTaxonomy(game)
  const rulesContent = checkRulesContent(game.rules_content)
  const setupContent = checkSetupContent(game.setup_content)
  const referenceContent = checkReferenceContent(game.reference_content)
  const publisherData = checkPublisherData(game)
  const images = checkImages(game)

  // Build categories
  const categories: FieldCategory[] = [
    {
      name: 'Core Game Data',
      description: 'Basic game info from BGG import',
      icon: 'Info',
      fields: coreData,
      ...calculateCategoryStats(coreData),
    },
    {
      name: 'External Sources',
      description: 'BGG, Wikidata, and Wikipedia data',
      icon: 'Database',
      fields: externalSources,
      ...calculateCategoryStats(externalSources),
    },
    {
      name: 'Publisher Data',
      description: 'Publisher info and regional distribution',
      icon: 'Building',
      fields: publisherData,
      ...calculateCategoryStats(publisherData),
    },
    {
      name: 'Rulebook & Parsing',
      description: 'Rulebook URL and parsed data',
      icon: 'FileText',
      fields: rulebookParsing,
      ...calculateCategoryStats(rulebookParsing),
    },
    {
      name: 'Taxonomy',
      description: 'Categories, mechanics, and themes',
      icon: 'Tags',
      fields: taxonomy,
      ...calculateCategoryStats(taxonomy),
    },
    {
      name: 'Rules Content',
      description: 'AI-generated rules summary',
      icon: 'BookOpen',
      fields: rulesContent,
      ...calculateCategoryStats(rulesContent),
    },
    {
      name: 'Setup Content',
      description: 'AI-generated setup guide',
      icon: 'ListChecks',
      fields: setupContent,
      ...calculateCategoryStats(setupContent),
    },
    {
      name: 'Reference Content',
      description: 'AI-generated quick reference',
      icon: 'ClipboardList',
      fields: referenceContent,
      ...calculateCategoryStats(referenceContent),
    },
    {
      name: 'Images',
      description: 'Game images for display',
      icon: 'Image',
      fields: images,
      ...calculateCategoryStats(images),
    },
  ]

  // Aggregate all fields
  const allFields = categories.flatMap(c => c.fields)
  const presentFields = allFields.filter(f => f.present).length
  const totalFields = allFields.length

  // Collect missing by importance
  const criticalMissing = allFields.filter(f => !f.present && f.importance === 'critical')
  const importantMissing = allFields.filter(f => !f.present && f.importance === 'important')
  const recommendedMissing = allFields.filter(f => !f.present && f.importance === 'recommended')

  // Determine overall status
  let status: 'complete' | 'needs_attention' | 'incomplete'
  let message: string

  if (criticalMissing.length === 0 && importantMissing.length === 0) {
    status = 'complete'
    message = recommendedMissing.length > 0
      ? `Ready for review. ${recommendedMissing.length} optional field${recommendedMissing.length !== 1 ? 's' : ''} could be improved.`
      : 'All required data is present!'
  } else if (criticalMissing.length > 0) {
    status = 'incomplete'
    message = `Missing ${criticalMissing.length} critical field${criticalMissing.length !== 1 ? 's' : ''} that must be filled.`
  } else {
    status = 'needs_attention'
    message = `Missing ${importantMissing.length} important field${importantMissing.length !== 1 ? 's' : ''} that should be reviewed.`
  }

  return {
    gameId: game.id,
    gameName: game.name,
    generatedAt: new Date().toISOString(),
    overallPercent: Math.round((presentFields / totalFields) * 100),
    totalFields,
    presentFields,
    criticalMissing,
    importantMissing,
    recommendedMissing,
    categories,
    summary: { status, message },
  }
}

// =====================================================
// Export helpers for UI
// =====================================================

export function getImportanceColor(importance: FieldImportance): string {
  switch (importance) {
    case 'critical':
      return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-800'
    case 'important':
      return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-800'
    case 'recommended':
      return 'text-orange-700 bg-orange-50 border-orange-200 dark:text-orange-300 dark:bg-orange-950/30 dark:border-orange-800'
    case 'optional':
      return 'text-slate-600 bg-slate-50 border-slate-200 dark:text-slate-400 dark:bg-slate-900/50 dark:border-slate-700'
  }
}

export function getImportanceLabel(importance: FieldImportance): string {
  switch (importance) {
    case 'critical':
      return 'Critical'
    case 'important':
      return 'Important'
    case 'recommended':
      return 'Recommended'
    case 'optional':
      return 'Optional'
  }
}

export function getStatusColor(status: CompletenessReport['summary']['status']): string {
  switch (status) {
    case 'complete':
      return 'text-green-700 bg-green-50 border-green-200 dark:text-green-300 dark:bg-green-950/30 dark:border-green-800'
    case 'needs_attention':
      return 'text-amber-700 bg-amber-50 border-amber-200 dark:text-amber-300 dark:bg-amber-950/30 dark:border-amber-800'
    case 'incomplete':
      return 'text-red-700 bg-red-50 border-red-200 dark:text-red-300 dark:bg-red-950/30 dark:border-red-800'
  }
}
