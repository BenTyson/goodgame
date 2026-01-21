'use client'

import Link from 'next/link'
import { BookOpen, Boxes, ExternalLink, ArrowRight, Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { useContentRequest } from '@/hooks/useContentRequest'
import { cleanWikipediaContentParagraphs } from '@/lib/utils/wikipedia'

interface ContentPlaceholderProps {
  game: { id: string; name: string; slug: string }
  contentType: 'rules' | 'setup'
  wikipediaGameplay?: string | null
  wikipediaUrl?: string | null
  rulebookUrl?: string | null
}

export function ContentPlaceholder({
  game,
  contentType,
  wikipediaGameplay,
  wikipediaUrl,
  rulebookUrl,
}: ContentPlaceholderProps) {
  const { requestCount, hasRequested, isLoading, handleRequest } = useContentRequest(game.id)

  const Icon = contentType === 'rules' ? BookOpen : Boxes
  const title = contentType === 'rules' ? 'Rules Summary' : 'Setup Guide'
  const description = contentType === 'rules'
    ? 'We\'re working on a comprehensive rules summary for this game.'
    : 'We\'re working on a detailed setup guide for this game.'

  // Get first paragraph of Wikipedia content as preview
  const wikipediaPreview = wikipediaGameplay
    ? cleanWikipediaContentParagraphs(wikipediaGameplay).slice(0, 1).join(' ')
    : null

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Card className="border-dashed">
        <CardContent className="pt-8 pb-6 text-center">
          {/* Icon */}
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Icon className="h-8 w-8 text-primary" />
          </div>

          {/* Heading */}
          <h2 className="text-2xl font-semibold mb-2">
            {title} Coming Soon
          </h2>

          {/* Description */}
          <p className="text-muted-foreground mb-6 max-w-md mx-auto">
            {description} Request this content to help us prioritize which games to cover first.
          </p>

          {/* Request button */}
          <div className="mb-8">
            <Button
              onClick={handleRequest}
              disabled={hasRequested || isLoading}
              variant={hasRequested ? 'secondary' : 'default'}
              size="lg"
              className="min-w-[200px]"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              {hasRequested ? 'Request Sent' : 'Request This Content'}
            </Button>

            {requestCount > 0 && (
              <p className="text-sm text-muted-foreground mt-2">
                {requestCount} {requestCount === 1 ? 'person has' : 'people have'} requested this content
              </p>
            )}
          </div>

          {/* Available resources */}
          {(wikipediaPreview || rulebookUrl) && (
            <div className="border-t pt-6 space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground mb-4">
                In the Meantime
              </h3>

              {/* Wikipedia preview */}
              {wikipediaPreview && (
                <div className="text-left bg-muted/50 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-2 line-clamp-3">
                    {wikipediaPreview}
                  </p>
                  {wikipediaUrl && (
                    <Link
                      href={wikipediaUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                    >
                      Read more on Wikipedia
                      <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                </div>
              )}

              {/* Rulebook link */}
              {rulebookUrl && (
                <Button variant="outline" className="w-full" asChild>
                  <a
                    href={rulebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <BookOpen className="mr-2 h-4 w-4" />
                    View Official Rulebook
                    <ExternalLink className="ml-2 h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>
          )}

          {/* Overview tab CTA */}
          <div className="mt-6 pt-4 border-t">
            <Button variant="ghost" asChild>
              <Link href={`/games/${game.slug}`}>
                Explore the Overview tab
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
