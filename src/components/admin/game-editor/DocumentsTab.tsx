'use client'

import { useState } from 'react'
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
  BookOpen,
  Layers,
  Clock,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { DocumentsData } from '@/lib/supabase/game-queries'
import type { ParsedTextStructured, RulebookSectionType } from '@/lib/rulebook/types'
import { RulebookUrlSection } from '@/components/admin/rulebook'
import { SupplementaryDocumentsSection } from './SupplementaryDocumentsSection'

interface Publisher {
  id: string
  name: string
  slug: string
  website: string | null
}

interface DocumentsTabProps {
  game: Game & { publishers_list?: Publisher[] }
  /** Preloaded documents data from server */
  initialData: DocumentsData
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

export function DocumentsTab({ game, initialData, onRulebookUrlChange }: DocumentsTabProps) {
  // Rulebook URL state
  const [rulebookUrl, setRulebookUrl] = useState(game.rulebook_url || '')

  // Use preloaded parsed text data
  const parsedTextData = initialData.parsedText

  // Section collapse state
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({})
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

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

      {/* Rulebook Content - Components & Parsed Text */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-primary" />
            </div>
            <div className="flex-1">
              <CardTitle className="text-lg uppercase">Rulebook Content</CardTitle>
              <CardDescription className="uppercase tracking-wider text-xs">
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
                  'Parsed via Vecna pipeline'
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Extracted Components - Compact inline */}
          {game.component_list && (
            <div className="space-y-2">
              <div className="uppercase tracking-wider text-xs text-primary font-medium">Components</div>
              <div className="flex flex-wrap gap-2">
                {Object.entries(game.component_list as Record<string, unknown>).map(([key, value]) => {
                  if (key === 'other' && Array.isArray(value)) {
                    return (
                      <span key={key} className="text-xs text-muted-foreground">
                        Other: {value.join(', ')}
                      </span>
                    )
                  }
                  if (typeof value === 'number' && value > 0) {
                    return (
                      <span key={key} className="inline-flex items-center gap-1 px-2 py-1 bg-muted/50 rounded text-xs">
                        <span className="font-medium">{value}</span>
                        <span className="text-muted-foreground capitalize">{key.replace(/_/g, ' ')}</span>
                      </span>
                    )
                  }
                  return null
                })}
              </div>
            </div>
          )}

          {/* Divider if both exist */}
          {game.component_list && parsedTextData?.text && (
            <div className="border-t-4 border-primary/30" />
          )}

          {/* Parsed Text */}
          {!parsedTextData?.text ? (
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
                                <span className="uppercase tracking-wider text-xs text-primary font-medium">
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

      {/* Supplementary Documents Section */}
      <SupplementaryDocumentsSection
        gameId={game.id}
        gameSlug={game.slug}
        initialDocuments={initialData.gameDocuments}
      />
    </div>
  )
}
