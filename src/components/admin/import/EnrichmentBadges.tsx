'use client'

import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { CheckCircle } from 'lucide-react'

interface EnrichmentBadgesProps {
  sources: {
    wikidata: boolean
    wikipedia: boolean
    commons: boolean
    rulebook: boolean
    puffinContent?: boolean
    puffinContentFieldCount?: number
  }
  importedToBoardmello?: boolean
  boardmelloSlug?: string
  compact?: boolean
}

export function EnrichmentBadges({
  sources,
  importedToBoardmello,
  boardmelloSlug,
  compact = false,
}: EnrichmentBadgesProps) {
  if (importedToBoardmello) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            {boardmelloSlug ? (
              <a
                href={`/admin/games/${boardmelloSlug}/edit`}
                className="inline-flex"
                onClick={(e) => e.stopPropagation()}
              >
                <Badge
                  variant="secondary"
                  className="gap-1 text-muted-foreground hover:bg-muted"
                >
                  <CheckCircle className="h-3 w-3" />
                  {!compact && 'Imported'}
                </Badge>
              </a>
            ) : (
              <Badge variant="secondary" className="gap-1 text-muted-foreground">
                <CheckCircle className="h-3 w-3" />
                {!compact && 'Imported'}
              </Badge>
            )}
          </TooltipTrigger>
          <TooltipContent>
            <p>Already imported to Boardmello</p>
            {boardmelloSlug && <p className="text-xs text-muted-foreground">Click to edit</p>}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  const badges = []

  if (sources.wikidata) {
    badges.push(
      <TooltipProvider key="wikidata">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-teal-500/10 text-teal-600 border-teal-500/30 dark:text-teal-400">
              W
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Has Wikidata enrichment</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (sources.wikipedia) {
    badges.push(
      <TooltipProvider key="wikipedia">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 dark:text-green-400">
              P
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Has Wikipedia article</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (sources.rulebook) {
    badges.push(
      <TooltipProvider key="rulebook">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30 dark:text-purple-400">
              R
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Has rulebook URL - best for Vecna</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (sources.puffinContent) {
    badges.push(
      <TooltipProvider key="puffin-content">
        <Tooltip>
          <TooltipTrigger asChild>
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30 dark:text-amber-400">
              C
            </Badge>
          </TooltipTrigger>
          <TooltipContent>Has AI content ({sources.puffinContentFieldCount || 0}/22 fields)</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  if (badges.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">-</span>
    )
  }

  return (
    <div className="flex gap-1">
      {badges}
    </div>
  )
}
