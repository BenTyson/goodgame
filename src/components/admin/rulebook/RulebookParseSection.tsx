'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
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
  const [loadingParsedText, setLoadingParsedText] = useState(false)
  const [showParsedText, setShowParsedText] = useState(false)
  const [copied, setCopied] = useState(false)

  const fetchParsedText = async () => {
    setLoadingParsedText(true)
    try {
      const response = await fetch(`/api/admin/rulebook/parsed-text?gameId=${gameId}`)
      const result = await response.json()
      if (result.text) {
        setParsedText(result.text)
        setShowParsedText(true)
      } else {
        setParsedText(null)
      }
    } catch (error) {
      console.error('Failed to fetch parsed text:', error)
      setParsedText(null)
    } finally {
      setLoadingParsedText(false)
    }
  }

  const copyParsedText = async () => {
    if (parsedText) {
      await navigator.clipboard.writeText(parsedText)
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
                if (parsedText) {
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

            {showParsedText && parsedText && (
              <div className="mt-3 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {parsedText.length.toLocaleString()} characters
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

            {showParsedText && !parsedText && !loadingParsedText && (
              <div className="mt-3 p-3 rounded-lg bg-muted text-sm text-muted-foreground">
                No parsed text found. Parse the rulebook first.
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
