'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ExternalLink,
  Search,
  Sparkles,
  Globe,
  ImageIcon,
} from 'lucide-react'
import type { Game } from '@/types/database'

interface Publisher {
  id: string
  name: string
  slug: string
  website: string | null
}

interface RulebookStepProps {
  game: Game & { publishers_list?: Publisher[] }
  updateField: <K extends keyof Game>(field: K, value: Game[K]) => void
  onComplete: () => void
  onSkip: () => void
}

export function RulebookStep({ game, updateField, onComplete, onSkip }: RulebookStepProps) {
  const [rulebookUrl, setRulebookUrl] = useState(game.rulebook_url || '')
  const [validating, setValidating] = useState(false)
  const [discovering, setDiscovering] = useState(false)
  const [validationResult, setValidationResult] = useState<{
    valid: boolean
    error?: string
    contentLength?: number
    searchQuery?: string
  } | null>(null)

  // Check if step is already complete
  const isComplete = !!game.rulebook_url

  useEffect(() => {
    if (isComplete) {
      onComplete()
    }
  }, [isComplete, onComplete])

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
        updateField('rulebook_url', rulebookUrl)
        onComplete()
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
        updateField('rulebook_url', result.url)
        onComplete()
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

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
            <BookOpen className="h-5 w-5 text-purple-500" />
          </div>
          <div>
            <CardTitle>Find the Official Rulebook</CardTitle>
            <CardDescription>
              Enter the URL to the official PDF rulebook, or let us try to find it automatically.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Publisher info */}
        {(game.publishers_list && game.publishers_list.length > 0) || game.publisher ? (
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground uppercase tracking-wider">
              Publisher
            </Label>
            <div className="flex flex-wrap gap-2">
              {game.publishers_list && game.publishers_list.length > 0 ? (
                game.publishers_list.map((publisher) =>
                  publisher.website ? (
                    <a
                      key={publisher.id}
                      href={publisher.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-muted text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                      {publisher.name}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  ) : (
                    <span
                      key={publisher.id}
                      className="inline-flex items-center px-3 py-1.5 rounded-md bg-muted text-sm font-medium"
                    >
                      {publisher.name}
                    </span>
                  )
                )
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-md bg-muted text-sm font-medium">
                  {game.publisher}
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Wikidata Status */}
        {(game.wikidata_id || game.official_website || game.wikidata_image_url) && (
          <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
                Wikidata Enrichment Available
              </span>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              {game.rulebook_source === 'wikidata' && game.rulebook_url && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
                  <BookOpen className="h-3 w-3 mr-1" />
                  Rulebook from Wikidata
                </Badge>
              )}
              {game.official_website && (
                <a
                  href={game.official_website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 transition-colors"
                >
                  <Globe className="h-3 w-3" />
                  Official Website
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {game.wikidata_image_url && (
                <Badge variant="secondary" className="bg-blue-500/10 text-blue-700 dark:text-blue-300">
                  <ImageIcon className="h-3 w-3 mr-1" />
                  CC Image Available
                </Badge>
              )}
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="space-y-3">
          <Label htmlFor="rulebook-url">Rulebook PDF URL</Label>
          <div className="flex gap-2">
            <Input
              id="rulebook-url"
              type="url"
              placeholder="https://example.com/rulebook.pdf"
              value={rulebookUrl}
              onChange={(e) => {
                setRulebookUrl(e.target.value)
                setValidationResult(null)
              }}
              className="flex-1"
            />
            {rulebookUrl && (
              <Button variant="outline" size="icon" asChild>
                <a href={rulebookUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3">
          <Button
            onClick={validateUrl}
            disabled={!rulebookUrl || validating}
            className="gap-2"
          >
            {validating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
            Validate URL
          </Button>
          <Button
            variant="outline"
            onClick={discoverUrl}
            disabled={discovering}
            className="gap-2"
          >
            {discovering ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Auto-Discover
          </Button>
        </div>

        {/* Validation Result */}
        {validationResult && (
          <div
            className={`flex items-start gap-3 p-4 rounded-lg ${
              validationResult.valid
                ? 'bg-green-50 text-green-800 dark:bg-green-950/30 dark:text-green-200'
                : 'bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200'
            }`}
          >
            {validationResult.valid ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div className="text-sm space-y-1">
              {validationResult.valid ? (
                <>
                  <p className="font-medium">Valid PDF found!</p>
                  {validationResult.contentLength && (
                    <p className="text-green-600 dark:text-green-300">
                      Size: {(validationResult.contentLength / 1024 / 1024).toFixed(1)} MB
                    </p>
                  )}
                </>
              ) : (
                <>
                  <p className="font-medium">{validationResult.error}</p>
                  {validationResult.searchQuery && (
                    <Button
                      variant="link"
                      size="sm"
                      asChild
                      className="h-auto p-0 text-red-600 dark:text-red-300"
                    >
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(validationResult.searchQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        Search manually
                      </a>
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {/* Current rulebook status */}
        {game.rulebook_url && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-green-500" />
            <span>Rulebook URL saved</span>
            {game.rulebook_source && (
              <Badge variant="outline" className="text-xs">
                {game.rulebook_source === 'wikidata' ? 'from Wikidata' : game.rulebook_source}
              </Badge>
            )}
            {game.rulebook_parsed_at && (
              <span className="text-xs">
                • Parsed {new Date(game.rulebook_parsed_at).toLocaleDateString()}
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
