'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Sparkles,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
} from 'lucide-react'
import type { ParsedTextStructured } from '@/lib/rulebook/types'

interface ParseResult {
  success: boolean
  wordCount?: number
  pageCount?: number
  crunchScore?: number
  crunchError?: string
  // Legacy fields for backward compatibility
  bncsScore?: number
  bncsError?: string
  error?: string
}

interface RulebookParseSectionProps {
  gameId: string
  rulebookUrl: string
  parsing: boolean
  parseResult: ParseResult | null
  rulebookParsedAt?: string | null
  onParse: () => void
}

export function RulebookParseSection({
  gameId,
  rulebookUrl,
  parsing,
  parseResult,
  rulebookParsedAt,
  onParse,
}: RulebookParseSectionProps) {
  const [parsedText, setParsedText] = useState<string | null>(null)
  const [structuredData, setStructuredData] = useState<ParsedTextStructured | null>(null)
  const [loadingParsedText, setLoadingParsedText] = useState(false)
  const [showParsedText, setShowParsedText] = useState(false)
  const [parsedTextError, setParsedTextError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)

  const fetchParsedText = async () => {
    setLoadingParsedText(true)
    setParsedTextError(null)
    try {
      const response = await fetch(`/api/admin/rulebook/parsed-text?gameId=${gameId}`)
      const result = await response.json()

      if (!response.ok) {
        setParsedTextError(result.error || `HTTP ${response.status}`)
        setParsedText(null)
        setShowParsedText(true)
        return
      }

      // Store structured data if available, otherwise fall back to raw text
      if (result.structured) {
        setStructuredData(result.structured as ParsedTextStructured)
        setParsedText(null) // Don't need raw text when we have structured
        setShowParsedText(true)
      } else if (result.text) {
        setParsedText(result.text)
        setStructuredData(null)
        setShowParsedText(true)
      } else {
        setParsedText(null)
        setStructuredData(null)
        setParsedTextError(result.message || 'No parsed text available')
        setShowParsedText(true)
      }
    } catch (error) {
      console.error('Failed to fetch parsed text:', error)
      setParsedTextError(error instanceof Error ? error.message : 'Failed to fetch')
      setParsedText(null)
      setShowParsedText(true)
    } finally {
      setLoadingParsedText(false)
    }
  }

  const copyParsedText = async () => {
    // Build formatted text from sections, or fall back to raw
    let textToCopy = ''
    if (structuredData?.sections) {
      textToCopy = structuredData.sections
        .map(s => `## ${s.title}\n\n${s.content}`)
        .join('\n\n---\n\n')
    } else if (parsedText) {
      textToCopy = parsedText
    }

    if (textToCopy) {
      await navigator.clipboard.writeText(textToCopy)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-purple-500" />
          </div>
          <div>
            <CardTitle className="text-lg">AI Content Extraction</CardTitle>
            <CardDescription>
              Parse rulebook PDF and generate Crunch Score
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button
          onClick={onParse}
          disabled={!rulebookUrl || parsing}
          className="w-full sm:w-auto"
        >
          {parsing ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          {parsing ? 'Parsing Rulebook...' : 'Parse & Generate Crunch Score'}
        </Button>

        {parseResult && (
          <div className="space-y-2">
            <div
              className={`flex items-start gap-2 p-3 rounded-lg ${
                parseResult.success
                  ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                  : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}
            >
              {parseResult.success ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              )}
              <div className="text-sm">
                {parseResult.success ? (
                  <>
                    Successfully parsed {parseResult.pageCount} pages
                    ({parseResult.wordCount?.toLocaleString()} words)
                    {(parseResult.crunchScore ?? parseResult.bncsScore) && (
                      <span className="ml-2 font-medium">
                        Crunch: {(parseResult.crunchScore ?? parseResult.bncsScore)?.toFixed(1)}/10
                      </span>
                    )}
                  </>
                ) : (
                  parseResult.error
                )}
              </div>
            </div>
            {(parseResult.crunchError ?? parseResult.bncsError) && (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 text-amber-500 border border-amber-500/20">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong>Crunch Score Failed:</strong> {parseResult.crunchError ?? parseResult.bncsError}
                </div>
              </div>
            )}
          </div>
        )}

        {/* View Parsed Text */}
        {rulebookParsedAt && (
          <div className="pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (structuredData || parsedText) {
                  setShowParsedText(!showParsedText)
                } else {
                  fetchParsedText()
                }
              }}
              disabled={loadingParsedText}
              className="w-full sm:w-auto"
            >
              {loadingParsedText ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : showParsedText ? (
                <ChevronUp className="h-4 w-4 mr-2" />
              ) : (
                <ChevronDown className="h-4 w-4 mr-2" />
              )}
              {loadingParsedText ? 'Loading...' : showParsedText ? 'Hide Parsed Text' : 'View Parsed Text'}
            </Button>

            {/* Structured sections display */}
            {showParsedText && structuredData && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {structuredData.metadata.totalWords.toLocaleString()} words
                    <span className="mx-1">·</span>
                    {structuredData.sections.length} sections
                    <span className="ml-2 text-green-600">(structured)</span>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyParsedText}
                    className="h-8"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="max-h-[500px] overflow-auto rounded-lg bg-muted p-4 space-y-4">
                  {structuredData.sections.map((section, idx) => (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{section.title}</h4>
                        <Badge variant="secondary" className="text-xs">
                          {section.type}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {section.wordCount} words
                        </span>
                      </div>
                      <div className="text-xs whitespace-pre-wrap text-muted-foreground pl-2 border-l-2 border-muted-foreground/20">
                        {section.content.length > 1000
                          ? section.content.slice(0, 1000) + '...'
                          : section.content}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Raw text fallback display */}
            {showParsedText && !structuredData && parsedText && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {parsedText.length.toLocaleString()} characters
                    <span className="ml-2 text-amber-600">(raw)</span>
                  </p>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={copyParsedText}
                    className="h-8"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 mr-1 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4 mr-1" />
                    )}
                    {copied ? 'Copied!' : 'Copy'}
                  </Button>
                </div>
                <div className="max-h-96 overflow-auto rounded-lg bg-muted p-4 font-mono text-xs whitespace-pre-wrap">
                  {parsedText}
                </div>
              </div>
            )}

            {/* Error / empty state */}
            {showParsedText && !structuredData && !parsedText && !loadingParsedText && (
              <div className={`mt-3 p-3 rounded-lg text-sm ${
                parsedTextError
                  ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {parsedTextError ? (
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    {parsedTextError}
                  </div>
                ) : (
                  'No parsed text found. Parse the rulebook first.'
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
