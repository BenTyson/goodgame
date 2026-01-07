'use client'

import { useState } from 'react'
import {
  FileText,
  Search,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Database,
  Globe,
  Building2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface RulebookCandidate {
  url: string
  source: 'wikidata' | 'wikipedia' | 'publisher_pattern' | 'web_search'
  confidence: 'high' | 'medium' | 'low'
  label?: string
  validated?: boolean
}

interface DiscoveryResult {
  gameId: string
  gameName: string
  currentRulebookUrl: string | null
  currentSource: string | null
  candidates: RulebookCandidate[]
  bestCandidate: RulebookCandidate | null
  canAutoSet: boolean
  searchQuery: string
  publisherInfo: {
    name: string | null
    website: string | null
  }
}

interface RulebookDiscoveryProps {
  gameId: string
  gameName: string
  currentRulebookUrl: string | null
  onRulebookSet: (url: string) => void
}

const SOURCE_CONFIG: Record<string, { icon: typeof Database; label: string; color: string }> = {
  wikidata: { icon: Database, label: 'Wikidata', color: 'text-blue-600 bg-blue-50 border-blue-200' },
  wikipedia: { icon: Globe, label: 'Wikipedia', color: 'text-violet-600 bg-violet-50 border-violet-200' },
  publisher_pattern: { icon: Building2, label: 'Publisher', color: 'text-green-600 bg-green-50 border-green-200' },
  web_search: { icon: Search, label: 'Search', color: 'text-slate-600 bg-slate-50 border-slate-200' },
}

export function RulebookDiscovery({
  gameId,
  gameName,
  currentRulebookUrl,
  onRulebookSet,
}: RulebookDiscoveryProps) {
  const [isDiscovering, setIsDiscovering] = useState(false)
  const [isSetting, setIsSetting] = useState(false)
  const [result, setResult] = useState<DiscoveryResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [manualUrl, setManualUrl] = useState('')

  const runDiscovery = async () => {
    setIsDiscovering(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/vecna/${gameId}/discover-rulebook`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ validate: true }),
      })

      if (!response.ok) {
        throw new Error('Discovery failed')
      }

      const data = await response.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Discovery failed')
    } finally {
      setIsDiscovering(false)
    }
  }

  const setRulebookUrl = async (url: string, source: string) => {
    setIsSetting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/vecna/${gameId}/discover-rulebook`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, source }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set URL')
      }

      onRulebookSet(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set URL')
    } finally {
      setIsSetting(false)
    }
  }

  const handleManualSubmit = () => {
    if (manualUrl.trim()) {
      setRulebookUrl(manualUrl.trim(), 'manual')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Rulebook Discovery</CardTitle>
          </div>
          {currentRulebookUrl && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Has Rulebook
            </Badge>
          )}
        </div>
        <CardDescription>
          Find the official rulebook PDF using multiple data sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current rulebook */}
        {currentRulebookUrl && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-1">Current Rulebook</div>
            <a
              href={currentRulebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-700 hover:underline flex items-center gap-1"
            >
              {currentRulebookUrl.length > 60
                ? `${currentRulebookUrl.slice(0, 60)}...`
                : currentRulebookUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Manual URL input - always visible */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Paste Rulebook URL:</div>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/rulebook.pdf"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manualUrl.trim() && handleManualSubmit()}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleManualSubmit}
              disabled={!manualUrl.trim() || isSetting}
            >
              {isSetting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set URL'}
            </Button>
          </div>
        </div>

        {/* Discovery button */}
        {!result && (
          <div className="pt-2 border-t">
            <div className="text-xs text-muted-foreground mb-2">
              Or search for rulebook URLs automatically:
            </div>
            <Button
              onClick={runDiscovery}
              disabled={isDiscovering}
              variant="outline"
              className="w-full gap-2"
            >
              {isDiscovering ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Discovering...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Discover Rulebook URLs
                </>
              )}
            </Button>
          </div>
        )}

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 dark:bg-red-950/30 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}

        {/* Discovery results */}
        {result && (
          <div className="space-y-4">
            {/* Publisher info */}
            {(result.publisherInfo.name || result.publisherInfo.website) && (
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">Publisher:</span> {result.publisherInfo.name || 'Unknown'}
                {result.publisherInfo.website && (
                  <a
                    href={result.publisherInfo.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-primary hover:underline"
                  >
                    Website
                  </a>
                )}
              </div>
            )}

            {/* Candidates list */}
            {result.candidates.length > 0 ? (
              <div className="space-y-2">
                <div className="text-sm font-medium">Found {result.candidates.length} candidate(s):</div>
                {result.candidates.map((candidate, index) => {
                  const config = SOURCE_CONFIG[candidate.source]
                  const Icon = config?.icon || FileText

                  return (
                    <div
                      key={index}
                      className={cn(
                        'p-3 rounded-lg border flex items-start gap-3',
                        candidate.validated === false && 'opacity-50'
                      )}
                    >
                      <div className={cn('p-2 rounded', config?.color.split(' ').slice(1).join(' '))}>
                        <Icon className={cn('h-4 w-4', config?.color.split(' ')[0])} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-xs',
                              candidate.confidence === 'high' && 'border-green-300 text-green-700',
                              candidate.confidence === 'medium' && 'border-amber-300 text-amber-700',
                              candidate.confidence === 'low' && 'border-slate-300 text-slate-700'
                            )}
                          >
                            {candidate.confidence}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{config?.label}</span>
                          {candidate.validated === true && (
                            <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                          )}
                          {candidate.validated === false && (
                            <XCircle className="h-3.5 w-3.5 text-red-500" />
                          )}
                        </div>
                        <a
                          href={candidate.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-primary hover:underline break-all"
                        >
                          {candidate.url}
                        </a>
                        {candidate.label && (
                          <div className="text-xs text-muted-foreground mt-1">{candidate.label}</div>
                        )}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isSetting || candidate.validated === false}
                        onClick={() => setRulebookUrl(candidate.url, candidate.source)}
                      >
                        {isSetting ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          'Use'
                        )}
                      </Button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg text-center dark:bg-amber-950/30 dark:border-amber-800">
                <AlertCircle className="h-6 w-6 text-amber-500 dark:text-amber-400 mx-auto mb-2" />
                <div className="text-sm text-amber-800 dark:text-amber-300">
                  No rulebook URLs found automatically.
                </div>
                <div className="text-xs text-amber-700 dark:text-amber-400 mt-1">
                  Try searching: <code className="bg-amber-100 dark:bg-amber-900/50 px-1 rounded">{result.searchQuery}</code>
                </div>
              </div>
            )}

            {/* Re-run discovery */}
            <Button
              variant="outline"
              size="sm"
              onClick={runDiscovery}
              disabled={isDiscovering}
              className="w-full"
            >
              Re-run Discovery
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
