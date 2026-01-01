'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen,
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Search,
  Globe,
  FileText,
} from 'lucide-react'
import { formatFileSize } from '@/lib/utils/format'

interface Publisher {
  id: string
  name: string
  slug: string
  website: string | null
}

interface ValidationResult {
  valid: boolean
  error?: string
  contentLength?: number
  searchQuery?: string
}

interface RulebookUrlSectionProps {
  rulebookUrl: string
  onRulebookUrlChange: (url: string) => void
  validationResult: ValidationResult | null
  onValidationResultChange: (result: ValidationResult | null) => void
  validating: boolean
  discovering: boolean
  onValidate: () => void
  onDiscover: () => void
  publishersList?: Publisher[]
  rulebookSource?: string | null
  rulebookParsedAt?: string | null
}

export function RulebookUrlSection({
  rulebookUrl,
  onRulebookUrlChange,
  validationResult,
  onValidationResultChange,
  validating,
  discovering,
  onValidate,
  onDiscover,
  publishersList,
  rulebookSource,
  rulebookParsedAt,
}: RulebookUrlSectionProps) {
  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-blue-500" />
          </div>
          <div>
            <CardTitle className="text-lg">Rulebook PDF</CardTitle>
            <CardDescription>
              Link to the official publisher rulebook for AI content extraction
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Publisher Website Link */}
        {publishersList && publishersList.length > 0 && publishersList.some(p => p.website) && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border">
            <Globe className="h-4 w-4 text-muted-foreground shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-muted-foreground">Publisher website - check for rulebook downloads:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {publishersList.filter(p => p.website).map((publisher) => (
                  <a
                    key={publisher.id}
                    href={publisher.website!}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    {publisher.name}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="rulebook_url">Rulebook URL</Label>
          <div className="flex gap-2">
            <Input
              id="rulebook_url"
              type="url"
              value={rulebookUrl}
              onChange={(e) => {
                onRulebookUrlChange(e.target.value)
                onValidationResultChange(null)
              }}
              placeholder="https://publisher.com/game-rulebook.pdf"
              className="flex-1"
            />
            {rulebookUrl && (
              <a
                href={rulebookUrl}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="icon">
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={onValidate}
            disabled={!rulebookUrl || validating}
          >
            {validating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle2 className="h-4 w-4 mr-2" />
            )}
            Validate URL
          </Button>

          <Button
            variant="outline"
            onClick={onDiscover}
            disabled={discovering}
          >
            {discovering ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            Auto-Discover
          </Button>
        </div>

        {validationResult && (
          <div
            className={`flex items-start gap-2 p-3 rounded-lg ${
              validationResult.valid
                ? 'bg-green-50 text-green-800'
                : 'bg-amber-50 text-amber-800'
            }`}
          >
            {validationResult.valid ? (
              <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
            )}
            <div className="text-sm flex-1">
              {validationResult.valid ? (
                <>
                  Valid PDF
                  {validationResult.contentLength && (
                    <span className="text-green-600 ml-1">
                      ({formatFileSize(validationResult.contentLength)})
                    </span>
                  )}
                </>
              ) : (
                <>
                  <p>{validationResult.error}</p>
                  {validationResult.searchQuery && (
                    <div className="mt-2">
                      <a
                        href={`https://www.google.com/search?q=${encodeURIComponent(validationResult.searchQuery)}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-amber-700 hover:text-amber-900 underline"
                      >
                        <Search className="h-3.5 w-3.5" />
                        Search Google for rulebook
                      </a>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {rulebookSource && (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <FileText className="h-4 w-4" />
            Source: {rulebookSource}
            {rulebookParsedAt && (
              <span className="ml-2">
                (Parsed {new Date(rulebookParsedAt).toLocaleDateString()})
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
