'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
  BookOpen,
  CheckCircle2,
  Loader2,
  ExternalLink,
  Search,
  Sparkles,
  Globe,
  ImageIcon,
} from 'lucide-react'
import type { Game } from '@/types/database'
import type { Publisher } from '@/lib/admin/wizard'
import { WizardStepHeader } from './WizardStepHeader'
import { StatusAlert } from './StatusAlert'
import { InfoPanel } from './InfoPanel'

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

  const validateUrl = useCallback(async () => {
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
  }, [rulebookUrl, updateField, onComplete])

  const discoverUrl = useCallback(async () => {
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
  }, [game.id, game.name, game.publisher, updateField, onComplete])

  return (
    <Card>
      <WizardStepHeader
        stepNumber={1}
        title="Find the Official Rulebook"
        description="Enter the URL to the official PDF rulebook, or let us try to find it automatically."
        icon={<BookOpen className="h-5 w-5" />}
        isComplete={isComplete}
      />
      <CardContent className="space-y-5 pt-0">
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
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted text-sm font-medium hover:bg-muted/80 transition-colors"
                    >
                      {publisher.name}
                      <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
                    </a>
                  ) : (
                    <span
                      key={publisher.id}
                      className="inline-flex items-center px-3 py-1.5 rounded-lg bg-muted text-sm font-medium"
                    >
                      {publisher.name}
                    </span>
                  )
                )
              ) : (
                <span className="inline-flex items-center px-3 py-1.5 rounded-lg bg-muted text-sm font-medium">
                  {game.publisher}
                </span>
              )}
            </div>
          </div>
        ) : null}

        {/* Wikidata Status */}
        {(game.wikidata_id || game.official_website || game.wikidata_image_url) && (
          <InfoPanel
            variant="accent"
            icon={<Globe className="h-4 w-4 text-blue-500" />}
            title="Wikidata Enrichment Available"
          >
            <div className="flex flex-wrap gap-2 mt-2">
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
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-blue-500/10 text-blue-700 dark:text-blue-300 hover:bg-blue-500/20 transition-colors text-xs font-medium"
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
          </InfoPanel>
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
          validationResult.valid ? (
            <StatusAlert variant="success" title="Valid PDF found!">
              {validationResult.contentLength && (
                <span>Size: {(validationResult.contentLength / 1024 / 1024).toFixed(1)} MB</span>
              )}
            </StatusAlert>
          ) : (
            <StatusAlert
              variant="error"
              title={validationResult.error}
              action={
                validationResult.searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    asChild
                    className="gap-1 h-8"
                  >
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(validationResult.searchQuery)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Search className="h-3.5 w-3.5" />
                      Search
                    </a>
                  </Button>
                )
              }
            >
              Try searching manually or enter a different URL.
            </StatusAlert>
          )
        )}

        {/* Current rulebook status */}
        {game.rulebook_url && !validationResult && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 rounded-lg bg-muted/30">
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
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
