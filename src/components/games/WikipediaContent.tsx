import Link from 'next/link'
import { ExternalLink, BookOpen, Quote } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface WikipediaContentProps {
  /** Section title */
  title?: string
  /** Content to display */
  content: string | null | undefined
  /** Wikipedia article URL for attribution */
  wikipediaUrl?: string | null
  /** When the content was fetched */
  fetchedAt?: string | null
  /** Display variant */
  variant?: 'default' | 'card' | 'inline'
  /** Maximum content length before truncation (0 = no limit) */
  maxLength?: number
  className?: string
}

// Format Wikipedia content for display
function formatContent(content: string): string {
  // Remove citation markers like [1], [2], etc.
  let formatted = content.replace(/\[\d+\]/g, '')
  // Remove extra whitespace
  formatted = formatted.replace(/\s+/g, ' ').trim()
  return formatted
}

// Truncate with ellipsis
function truncate(text: string, maxLength: number): { text: string; truncated: boolean } {
  if (maxLength === 0 || text.length <= maxLength) {
    return { text, truncated: false }
  }
  // Find last space before maxLength
  const lastSpace = text.lastIndexOf(' ', maxLength)
  const cutoff = lastSpace > maxLength * 0.7 ? lastSpace : maxLength
  return {
    text: text.slice(0, cutoff) + '...',
    truncated: true
  }
}

// Attribution footer component
function WikipediaAttribution({
  url,
  fetchedAt,
  compact = false
}: {
  url: string
  fetchedAt?: string | null
  compact?: boolean
}) {
  const domain = 'Wikipedia'

  return (
    <div className={cn(
      'flex items-center justify-between gap-2 text-xs text-muted-foreground',
      compact ? 'mt-2' : 'mt-4 pt-3 border-t'
    )}>
      <div className="flex items-center gap-1.5">
        <BookOpen className="h-3 w-3" />
        <span>
          Content from{' '}
          <Link
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            {domain}
          </Link>
          {' '}under{' '}
          <Link
            href="https://creativecommons.org/licenses/by-sa/4.0/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:underline"
          >
            CC BY-SA
          </Link>
        </span>
      </div>
      <Link
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        Read more
        <ExternalLink className="h-3 w-3" />
      </Link>
    </div>
  )
}

export function WikipediaContent({
  title,
  content,
  wikipediaUrl,
  fetchedAt,
  variant = 'default',
  maxLength = 0,
  className
}: WikipediaContentProps) {
  if (!content) return null

  const formatted = formatContent(content)
  const { text: displayText, truncated } = truncate(formatted, maxLength)

  // Card variant
  if (variant === 'card') {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          {title && (
            <CardTitle className="text-base flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-muted-foreground" />
              {title}
            </CardTitle>
          )}
          {!title && wikipediaUrl && (
            <CardDescription className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5" />
              From Wikipedia
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {displayText}
          </p>
          {truncated && wikipediaUrl && (
            <Button
              variant="link"
              size="sm"
              className="h-auto p-0 mt-2 text-xs"
              asChild
            >
              <Link href={wikipediaUrl} target="_blank" rel="noopener noreferrer">
                Read full article
                <ExternalLink className="h-3 w-3 ml-1" />
              </Link>
            </Button>
          )}
          {wikipediaUrl && (
            <WikipediaAttribution url={wikipediaUrl} fetchedAt={fetchedAt} />
          )}
        </CardContent>
      </Card>
    )
  }

  // Inline variant (minimal)
  if (variant === 'inline') {
    return (
      <div className={cn('text-sm text-muted-foreground', className)}>
        <p className="leading-relaxed">{displayText}</p>
        {wikipediaUrl && (
          <WikipediaAttribution url={wikipediaUrl} fetchedAt={fetchedAt} compact />
        )}
      </div>
    )
  }

  // Default variant
  return (
    <div className={cn('space-y-3', className)}>
      {title && (
        <h3 className="font-semibold flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-muted-foreground" />
          {title}
        </h3>
      )}
      <div className="relative">
        <Quote className="absolute -left-1 -top-1 h-6 w-6 text-muted-foreground/20" />
        <blockquote className="pl-6 border-l-2 border-muted">
          <p className="text-muted-foreground leading-relaxed">
            {displayText}
          </p>
        </blockquote>
      </div>
      {truncated && wikipediaUrl && (
        <Button
          variant="link"
          size="sm"
          className="h-auto p-0 text-xs"
          asChild
        >
          <Link href={wikipediaUrl} target="_blank" rel="noopener noreferrer">
            Continue reading on Wikipedia
            <ExternalLink className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      )}
      {wikipediaUrl && (
        <WikipediaAttribution url={wikipediaUrl} fetchedAt={fetchedAt} />
      )}
    </div>
  )
}

// Gameplay section specifically
export function WikipediaGameplay({
  gameplay,
  wikipediaUrl,
  className
}: {
  gameplay: string | null | undefined
  wikipediaUrl?: string | null
  className?: string
}) {
  return (
    <WikipediaContent
      title="How It Plays"
      content={gameplay}
      wikipediaUrl={wikipediaUrl}
      maxLength={600}
      className={className}
    />
  )
}

// Reception section specifically
export function WikipediaReception({
  reception,
  wikipediaUrl,
  className
}: {
  reception: string | null | undefined
  wikipediaUrl?: string | null
  className?: string
}) {
  return (
    <WikipediaContent
      title="Critical Reception"
      content={reception}
      wikipediaUrl={wikipediaUrl}
      maxLength={500}
      className={className}
    />
  )
}
