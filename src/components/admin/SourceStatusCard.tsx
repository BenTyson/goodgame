'use client'

import type { ReactNode } from 'react'
import { ExternalLink, CheckCircle2, AlertCircle } from 'lucide-react'

interface SourceStatusCardProps {
  title: string
  isLinked: boolean
  linkUrl?: string
  linkTitle?: string
  children?: ReactNode
}

/**
 * Shared source status card for the Quick Overview section
 * Used in SourcesTab for BGG/Wikidata/Wikipedia status display
 *
 * @example
 * <SourceStatusCard
 *   title="BoardGameGeek"
 *   isLinked={!!game.bgg_id}
 *   linkUrl={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
 *   linkTitle="View on BGG"
 * >
 *   <p className="text-xs text-muted-foreground">ID: {game.bgg_id}</p>
 *   <p className="text-xs text-muted-foreground">Synced: {formatDate(game.bgg_last_synced)}</p>
 * </SourceStatusCard>
 */
export function SourceStatusCard({
  title,
  isLinked,
  linkUrl,
  linkTitle = 'View',
  children,
}: SourceStatusCardProps) {
  return (
    <div className="p-3 rounded-lg border bg-card">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          {isLinked ? (
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          ) : (
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          )}
          <span className="font-medium text-sm">{title}</span>
        </div>
        {isLinked && linkUrl && (
          <a
            href={linkUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            title={linkTitle}
          >
            <ExternalLink className="h-4 w-4" />
          </a>
        )}
      </div>
      {isLinked ? (
        children
      ) : (
        <p className="text-xs text-muted-foreground">Not linked</p>
      )}
    </div>
  )
}
