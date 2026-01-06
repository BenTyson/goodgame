'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  FileText,
  Copy,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  BookOpen,
  Layers,
  Clock,
  AlertCircle,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { ParsedTextStructured, RulebookSectionType } from '@/lib/rulebook/types'
import {
  RulebookUrlSection,
  RulebookParseSection,
  CrunchScoreDisplay,
} from '@/components/admin/rulebook'

interface Publisher {
  id: string
  name: string
  slug: string
  website: string | null
}

interface RulebookTabProps {
  game: Game & { publishers_list?: Publisher[] }
  onRulebookUrlChange: (url: string | null) => void
}

// Section type display info
const SECTION_TYPE_INFO: Record<RulebookSectionType, { label: string; color: string }> = {
  overview: { label: 'Overview', color: 'text-blue-500' },
  components: { label: 'Components', color: 'text-teal-500' },
  setup: { label: 'Setup', color: 'text-cyan-500' },
  gameplay: { label: 'Gameplay', color: 'text-green-500' },
  turns: { label: 'Turn Structure', color: 'text-emerald-500' },
  actions: { label: 'Actions', color: 'text-lime-500' },
  scoring: { label: 'Scoring', color: 'text-amber-500' },
  variants: { label: 'Variants', color: 'text-orange-500' },
  glossary: { label: 'Glossary', color: 'text-purple-500' },
  faq: { label: 'FAQ', color: 'text-pink-500' },
  other: { label: 'Other', color: 'text-gray-500' },
}

export function RulebookTab({ game, onRulebookUrlChange }: RulebookTabProps) {
  // Rulebook URL state
  const [rulebookUrl, setRulebookUrl] = useState(game.rulebook_url || '')
  const [validating, setValidating] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    error?: string
    contentLength?: number
    searchQuery?: string
  } | null>(null)
  const [discovering, setDiscovering] = useState(false)
  const [parsing, setParsing] = useState(false)
  const [parseResult, setParseResult] = useState<{
    success: boolean
    wordCount?: number
    pageCount?: number
    crunchScore?: number
    error?: string
  } | null>(null)

  // Parsed text state
  const [loadingParsedText, setLoadingParsedText] = useState(false)
  const [parsedTextData, setParsedTextData] = useState<{
    text: string | null
    structured: ParsedTextStructured | null
    wordCount: number | null
    pageCount: number | null
    parsedAt: string | null
    characterCount: number | null
  } | null>(null)
  const [parsedTextError, setParsedTextError] = useState<string | null>(null)

  // Section collapse state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  // Fetch parsed text on mount if rulebook has been parsed
  useEffect(() => {
    if (game.rulebook_parsed_at) {
      fetchParsedText()
    }
  }, [game.id, game.rulebook_parsed_at])

  const fetchParsedText = async () => {
    setLoadingParsedText(true)
    setParsedTextError(null)

    try {
      const response = await fetch(`/api/admin/rulebook/parsed-text?gameId=${game.id}`)
      const data = await response.json()

      if (data.error) {
        setParsedTextError(data.error)
      } else {
        setParsedTextData(data)
      }
    } catch (error) {
      setParsedTextError(error instanceof Error ? error.message : 'Failed to fetch parsed text')
    } finally {
      setLoadingParsedText(false)
    }
  }

  // Rulebook handlers
  const validateUrl = async () => {
    if (!rulebookUrl) return
    setValidating(true)
    setValidationResult(null)

    try {
      const response = await fetch('/api/admin/rulebook/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: rulebookUrl }),
      })
      const result = await response.json()
      setValidationResult(result)
      if (result.valid) {
        onRulebookUrlChange(rulebookUrl)
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Validation failed',
      })
    } finally {
      setValidating(false)
    }
  }

  const discoverUrl = async () => {
    setDiscovering(true)
    setValidationResult(null)

    try {
      const response = await fetch('/api/admin/rulebook/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId: game.id,
          gameName: game.name,
          publisher: game.publisher,
        }),
      })
      const result = await response.json()

      if (result.found && result.url) {
        setRulebookUrl(result.url)
        setValidationResult({ valid: true })
        onRulebookUrlChange(result.url)
      } else {
        setValidationResult({
          valid: false,
          error: result.notes || 'No rulebook found automatically',
          searchQuery: result.searchQuery,
        })
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        error: error instanceof Error ? error.message : 'Discovery failed',
      })
    } finally {
      setDiscovering(false)
    }
  }

  const parseRulebook = async () => {
    if (!rulebookUrl) return
    setParsing(true)
    setParseResult(null)

    try {
      const response = await fetch('/api/admin/rulebook/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId: game.id, url: rulebookUrl }),
      })
      const result = await response.json()
      setParseResult(result)
      if (result.success) {
        // Refresh parsed text after successful parse
        await fetchParsedText()
        // Reload page to get updated game data
        setTimeout(() => window.location.reload(), 1500)
      }
    } catch (error) {
      setParseResult({
        success: false,
        error: error instanceof Error ? error.message : 'Parsing failed',
      })
    } finally {
      setParsing(false)
    }
  }

  // Copy section content to clipboard
  const copySection = async (content: string, sectionKey: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setCopiedSection(sectionKey)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (error) {
      console.error('Failed to copy:', error)
    }
  }

  // Group sections by type
  const groupSectionsByType = (structured: ParsedTextStructured) => {
    const groups: Record<RulebookSectionType, typeof structured.sections> = {
      overview: [],
      components: [],
      setup: [],
      gameplay: [],
      turns: [],
      actions: [],
      scoring: [],
      variants: [],
      glossary: [],
      faq: [],
      other: [],
    }

    structured.sections.forEach((section) => {
      groups[section.type].push(section)
    })

    return groups
  }

  // Toggle section expansion
  const toggleSection = (key: string) => {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  // Expand all sections
  const expandAll = () => {
    if (!parsedTextData?.structured) return
    const groups = groupSectionsByType(parsedTextData.structured)
    const newExpanded: Record<string, boolean> = {}
    Object.entries(groups).forEach(([type, sections]) => {
      if (sections.length > 0) {
        newExpanded[type] = true
        sections.forEach((_, i) => {
          newExpanded[`${type}-${i}`] = true
        })
      }
    })
    setExpandedSections(newExpanded)
  }

  // Collapse all sections
  const collapseAll = () => {
    setExpandedSections({})
  }

  return (
    <div className="space-y-6">
      {/* Rulebook URL Section */}
      <RulebookUrlSection
        rulebookUrl={rulebookUrl}
        onRulebookUrlChange={setRulebookUrl}
        validationResult={validationResult}
        onValidationResultChange={setValidationResult}
        validating={validating}
        discovering={discovering}
        onValidate={validateUrl}
        onDiscover={discoverUrl}
        publishersList={game.publishers_list}
        wikipediaInfobox={
          game.wikipedia_infobox as {
            publisher?: string[]
            publishersWithRegion?: { name: string; region?: string; isPrimary?: boolean }[]
          } | null
        }
        rulebookSource={game.rulebook_source}
        rulebookParsedAt={game.rulebook_parsed_at}
      />

      {/* Parse & Generate Crunch Score */}
      <RulebookParseSection
        gameId={game.id}
        rulebookUrl={rulebookUrl}
        parsing={parsing}
        parseResult={parseResult}
        rulebookParsedAt={game.rulebook_parsed_at}
        onParse={parseRulebook}
      />

      {/* Crunch Score Display */}
      {game.crunch_score && (
        <CrunchScoreDisplay
          score={game.crunch_score}
          breakdown={game.crunch_breakdown as Parameters<typeof CrunchScoreDisplay>[0]['breakdown']}
          generatedAt={game.crunch_generated_at}
          bggReference={game.crunch_bgg_reference}
        />
      )}

      {/* Component List */}
      {game.component_list && (
        <Card>
          <CardHeader className="pb-4">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-teal-500/10 flex items-center justify-center">
                <FileText className="h-4 w-4 text-teal-500" />
              </div>
              <div>
                <CardTitle className="text-lg">Extracted Components</CardTitle>
                <CardDescription>Components detected from rulebook</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {Object.entries(game.component_list as Record<string, unknown>).map(([key, value]) => {
                if (key === 'other' && Array.isArray(value)) {
                  return (
                    <div key={key} className="col-span-full">
                      <span className="text-sm text-muted-foreground">Other: </span>
                      <span className="text-sm">{value.join(', ')}</span>
                    </div>
                  )
                }
                if (typeof value === 'number' && value > 0) {
                  return (
                    <div key={key} className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg">
                      <span className="font-medium">{value}</span>
                      <span className="text-sm text-muted-foreground capitalize">
                        {key.replace(/_/g, ' ')}
                      </span>
                    </div>
                  )
                }
                return null
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Parsed Text Viewer */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-violet-500" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg">Parsed Rulebook Text</CardTitle>
              <CardDescription>
                {parsedTextData?.structured ? (
                  <>
                    {parsedTextData.structured.sections.length} sections &middot;{' '}
                    {parsedTextData.wordCount?.toLocaleString() || 0} words
                    {parsedTextData.parsedAt && (
                      <>
                        {' '}
                        &middot; Parsed{' '}
                        {new Date(parsedTextData.parsedAt).toLocaleDateString()}
                      </>
                    )}
                  </>
                ) : (
                  'Parse the rulebook to view text'
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loadingParsedText ? (
            <div className="flex items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin mr-2" />
              Loading parsed text...
            </div>
          ) : parsedTextError ? (
            <div className="flex items-center gap-2 text-destructive py-4">
              <AlertCircle className="h-4 w-4" />
              {parsedTextError}
            </div>
          ) : !parsedTextData?.text ? (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No parsed text available.</p>
              <p className="text-sm">Parse the rulebook to extract text content.</p>
            </div>
          ) : (
            <Tabs defaultValue="sections" className="space-y-4">
              <div className="flex items-center justify-between">
                <TabsList>
                  <TabsTrigger value="sections" className="gap-2">
                    <Layers className="h-4 w-4" />
                    By Section
                  </TabsTrigger>
                  <TabsTrigger value="full" className="gap-2">
                    <FileText className="h-4 w-4" />
                    Full Text
                  </TabsTrigger>
                </TabsList>

                {parsedTextData.structured && (
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={expandAll}>
                      Expand All
                    </Button>
                    <Button variant="ghost" size="sm" onClick={collapseAll}>
                      Collapse All
                    </Button>
                  </div>
                )}
              </div>

              {/* By Section View */}
              <TabsContent value="sections" className="space-y-3">
                {parsedTextData.structured ? (
                  (() => {
                    const groups = groupSectionsByType(parsedTextData.structured!)
                    return Object.entries(groups)
                      .filter(([, sections]) => sections.length > 0)
                      .map(([type, sections]) => {
                        const typeInfo = SECTION_TYPE_INFO[type as RulebookSectionType]
                        const isExpanded = expandedSections[type]

                        return (
                          <Collapsible
                            key={type}
                            open={isExpanded}
                            onOpenChange={() => toggleSection(type)}
                          >
                            <CollapsibleTrigger asChild>
                              <div className="flex items-center gap-2 p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors">
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                                ) : (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                                <span className={`font-medium ${typeInfo.color}`}>
                                  {typeInfo.label}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  ({sections.length} section{sections.length !== 1 ? 's' : ''})
                                </span>
                              </div>
                            </CollapsibleTrigger>
                            <CollapsibleContent className="space-y-2 mt-2 ml-6">
                              {sections.map((section, i) => {
                                const sectionKey = `${type}-${i}`
                                const isSectionExpanded = expandedSections[sectionKey]

                                return (
                                  <Collapsible
                                    key={sectionKey}
                                    open={isSectionExpanded}
                                    onOpenChange={() => toggleSection(sectionKey)}
                                  >
                                    <div className="border rounded-lg overflow-hidden">
                                      <CollapsibleTrigger asChild>
                                        <div className="flex items-center gap-2 p-2.5 bg-background hover:bg-muted/30 cursor-pointer transition-colors">
                                          {isSectionExpanded ? (
                                            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
                                          ) : (
                                            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                                          )}
                                          <span className="font-medium text-sm flex-1 truncate">
                                            {section.title}
                                          </span>
                                          <span className="text-xs text-muted-foreground">
                                            {section.wordCount.toLocaleString()} words
                                          </span>
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-7 w-7 p-0"
                                            onClick={(e) => {
                                              e.stopPropagation()
                                              copySection(section.content, sectionKey)
                                            }}
                                          >
                                            {copiedSection === sectionKey ? (
                                              <Check className="h-3.5 w-3.5 text-green-500" />
                                            ) : (
                                              <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                                            )}
                                          </Button>
                                        </div>
                                      </CollapsibleTrigger>
                                      <CollapsibleContent>
                                        <ScrollArea className="max-h-80">
                                          <pre className="p-3 text-sm whitespace-pre-wrap font-sans bg-muted/20 border-t">
                                            {section.content}
                                          </pre>
                                        </ScrollArea>
                                      </CollapsibleContent>
                                    </div>
                                  </Collapsible>
                                )
                              })}
                            </CollapsibleContent>
                          </Collapsible>
                        )
                      })
                  })()
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No structured sections available.</p>
                    <p className="text-sm">Re-parse the rulebook to generate structured sections.</p>
                  </div>
                )}
              </TabsContent>

              {/* Full Text View */}
              <TabsContent value="full">
                <div className="relative">
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-1.5"
                      onClick={() =>
                        copySection(
                          parsedTextData.structured?.cleanedText || parsedTextData.text || '',
                          'full-text'
                        )
                      }
                    >
                      {copiedSection === 'full-text' ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy All
                        </>
                      )}
                    </Button>
                  </div>
                  <ScrollArea className="h-[500px] rounded-lg border">
                    <pre className="p-4 text-sm whitespace-pre-wrap font-sans">
                      {parsedTextData.structured?.cleanedText || parsedTextData.text}
                    </pre>
                  </ScrollArea>
                </div>

                {/* Cleaning info */}
                {parsedTextData.structured?.metadata.cleaningApplied && (
                  <div className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
                    <Clock className="h-3.5 w-3.5" />
                    Cleaning applied:{' '}
                    {parsedTextData.structured.metadata.cleaningApplied.join(', ')}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
