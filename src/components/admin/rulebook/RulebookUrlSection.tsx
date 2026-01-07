'use client'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  BookOpen,
  ExternalLink,
  Search,
  FileText,
  Star,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface Publisher {
  id: string
  name: string
  slug: string
  website: string | null
  is_primary?: boolean
}

interface WikipediaInfobox {
  publisher?: string[]
  publishersWithRegion?: { name: string; region?: string; isPrimary?: boolean }[]
}

interface RulebookUrlSectionProps {
  rulebookUrl: string
  onRulebookUrlChange: (url: string) => void
  publishersList?: Publisher[]
  wikipediaInfobox?: WikipediaInfobox | null
  rulebookSource?: string | null
  rulebookParsedAt?: string | null
}

export function RulebookUrlSection({
  rulebookUrl,
  onRulebookUrlChange,
  publishersList,
  wikipediaInfobox,
  rulebookSource,
  rulebookParsedAt,
}: RulebookUrlSectionProps) {
  // Extract Wikipedia infobox publishers that aren't already in publishers_list
  const knownPublisherNames = new Set(
    (publishersList || []).map(p => p.name.toLowerCase())
  )

  const wikipediaPublishers: { name: string; region?: string }[] = (
    wikipediaInfobox?.publishersWithRegion ||
    wikipediaInfobox?.publisher?.map(name => ({ name })) ||
    []
  ).filter(p => !knownPublisherNames.has(p.name.toLowerCase()))

  const hasLinkedPublishers = publishersList && publishersList.length > 0 && publishersList.some(p => p.website)
  const hasWikipediaPublishers = wikipediaPublishers.length > 0

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <BookOpen className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg uppercase">Rulebook PDF</CardTitle>
            <CardDescription className="uppercase tracking-wider text-xs">
              Link to the official publisher rulebook for AI content extraction
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Publisher Website Links */}
        {(hasLinkedPublishers || hasWikipediaPublishers) && (
          <div className="space-y-2">
            <div className="uppercase tracking-wider text-xs text-primary font-medium">Publisher Websites</div>
            <div className="flex flex-wrap gap-2">
              {/* Linked publishers with websites */}
              {publishersList?.filter(p => p.website).map((publisher) => (
                <Button
                  key={publisher.id}
                  variant="outline"
                  size="sm"
                  className={cn(
                    'h-8 gap-1.5',
                    publisher.is_primary && 'border-primary/50 bg-primary/5'
                  )}
                  asChild
                >
                  <a
                    href={publisher.website!}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {publisher.is_primary && <Star className="h-3 w-3 text-primary fill-primary/20" />}
                    {publisher.name}
                    <ExternalLink className="h-3 w-3 text-muted-foreground" />
                  </a>
                </Button>
              ))}
              {/* Wikipedia infobox publishers (search links) */}
              {wikipediaPublishers.map((publisher, idx) => (
                <Button
                  key={`wiki-${idx}`}
                  variant="ghost"
                  size="sm"
                  className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
                  asChild
                >
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(publisher.name + ' board game rulebook pdf')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={`Search for ${publisher.name} rulebook (from Wikipedia)`}
                  >
                    {publisher.name}
                    {publisher.region && <span className="text-xs">({publisher.region})</span>}
                    <Search className="h-3 w-3" />
                  </a>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="rulebook_url" className="uppercase tracking-wider text-xs text-primary">Rulebook URL</Label>
          <div className="flex gap-2">
            <Input
              id="rulebook_url"
              type="url"
              value={rulebookUrl}
              onChange={(e) => onRulebookUrlChange(e.target.value)}
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
