'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronRight,
  ExternalLink,
  CircleDot,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { VecnaGame } from '@/lib/vecna'
import {
  generateCompletenessReport,
  type CompletenessReport,
  type FieldStatus,
} from '@/lib/vecna/completeness'
import { STATUS_COLORS } from '@/lib/vecna/ui-theme'

interface CompactStatusCardProps {
  game: VecnaGame
  className?: string
}

// Group missing fields by source for "Edit in Game Editor" links
function getEditSection(source: string | undefined): string {
  if (!source) return 'details'
  if (source.includes('generation')) return 'content'
  if (source.includes('import') || source.includes('enrichment')) return 'sources'
  if (source.includes('manual')) return 'details'
  return 'details'
}

// Importance icon with correct colors
function ImportanceIcon({ importance }: { importance: FieldStatus['importance'] }) {
  switch (importance) {
    case 'critical':
      return <XCircle className={cn('h-3 w-3', STATUS_COLORS.error.icon)} />
    case 'important':
      return <AlertTriangle className={cn('h-3 w-3', STATUS_COLORS.warning.icon)} />
    case 'recommended':
      return <CircleDot className={cn('h-3 w-3', STATUS_COLORS.suggestion.icon)} />
    case 'optional':
      return <CircleDot className={cn('h-3 w-3', STATUS_COLORS.neutral.icon)} />
  }
}

export function CompactStatusCard({ game, className }: CompactStatusCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)

  const report = useMemo(() => generateCompletenessReport(game), [game])

  const isComplete = report.summary.status === 'complete' && report.recommendedMissing.length === 0
  const hasCritical = report.criticalMissing.length > 0
  const hasImportant = report.importantMissing.length > 0
  const hasRecommended = report.recommendedMissing.length > 0

  // Determine overall status color
  const statusColor = hasCritical
    ? STATUS_COLORS.error
    : hasImportant
      ? STATUS_COLORS.warning
      : hasRecommended
        ? STATUS_COLORS.suggestion
        : STATUS_COLORS.success

  return (
    <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all',
            'hover:bg-muted/30',
            statusColor.bg,
            statusColor.border,
            className
          )}
        >
          <div className="flex items-center gap-3">
            {/* Status icon */}
            {isComplete ? (
              <CheckCircle2 className={cn('h-4 w-4', STATUS_COLORS.success.icon)} />
            ) : hasCritical ? (
              <XCircle className={cn('h-4 w-4', STATUS_COLORS.error.icon)} />
            ) : hasImportant ? (
              <AlertTriangle className={cn('h-4 w-4', STATUS_COLORS.warning.icon)} />
            ) : (
              <CircleDot className={cn('h-4 w-4', STATUS_COLORS.suggestion.icon)} />
            )}

            {/* Label + percentage */}
            <span className={cn('text-sm font-medium', statusColor.text)}>
              Data Status
            </span>
            <Badge variant="secondary" className="text-xs">
              {report.overallPercent}%
            </Badge>
          </div>

          <div className="flex items-center gap-2">
            {/* Issue counts */}
            {hasCritical && (
              <Badge className={cn('text-xs', STATUS_COLORS.error.badge)}>
                {report.criticalMissing.length} Critical
              </Badge>
            )}
            {hasImportant && (
              <Badge className={cn('text-xs', STATUS_COLORS.warning.badge)}>
                {report.importantMissing.length} Important
              </Badge>
            )}
            {hasRecommended && !hasCritical && !hasImportant && (
              <Badge className={cn('text-xs', STATUS_COLORS.suggestion.badge)}>
                {report.recommendedMissing.length} Suggested
              </Badge>
            )}
            {isComplete && (
              <Badge className={cn('text-xs', STATUS_COLORS.success.badge)}>
                Ready
              </Badge>
            )}

            {/* Expand indicator */}
            <ChevronRight
              className={cn(
                'h-4 w-4 text-muted-foreground transition-transform',
                isExpanded && 'rotate-90'
              )}
            />
          </div>
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-2 px-4 py-3 rounded-lg border bg-card space-y-3">
          {/* Critical issues */}
          {hasCritical && (
            <MissingFieldsSection
              title="Critical Issues"
              fields={report.criticalMissing}
              gameId={game.id}
              colorSet={STATUS_COLORS.error}
            />
          )}

          {/* Important issues */}
          {hasImportant && (
            <MissingFieldsSection
              title="Important Issues"
              fields={report.importantMissing}
              gameId={game.id}
              colorSet={STATUS_COLORS.warning}
            />
          )}

          {/* Recommended (only show if no critical/important) */}
          {hasRecommended && !hasCritical && !hasImportant && (
            <MissingFieldsSection
              title="Suggested Improvements"
              fields={report.recommendedMissing}
              gameId={game.id}
              colorSet={STATUS_COLORS.suggestion}
            />
          )}

          {/* All complete */}
          {isComplete && (
            <div className="flex items-center gap-2 text-sm">
              <CheckCircle2 className={cn('h-4 w-4', STATUS_COLORS.success.icon)} />
              <span className={STATUS_COLORS.success.text}>All required data is present</span>
            </div>
          )}

          {/* Edit link */}
          <div className="pt-2 border-t">
            <Link
              href={`/admin/games/${game.id}`}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"
            >
              Edit in Game Editor
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Simplified missing fields section
function MissingFieldsSection({
  title,
  fields,
  gameId,
  colorSet,
}: {
  title: string
  fields: FieldStatus[]
  gameId: string
  colorSet: (typeof STATUS_COLORS)[keyof typeof STATUS_COLORS]
}) {
  // Group by edit section
  const grouped = fields.reduce((acc, field) => {
    const section = getEditSection(field.source)
    if (!acc[section]) acc[section] = []
    acc[section].push(field)
    return acc
  }, {} as Record<string, FieldStatus[]>)

  return (
    <div className="space-y-1.5">
      <div className={cn('text-xs font-medium', colorSet.text)}>{title}</div>
      <div className="grid gap-1">
        {fields.slice(0, 5).map((field) => (
          <div
            key={field.field}
            className="flex items-center gap-2 text-sm text-muted-foreground"
          >
            <ImportanceIcon importance={field.importance} />
            <span>{field.label}</span>
            {field.note && (
              <span className="text-xs opacity-60">({field.note})</span>
            )}
          </div>
        ))}
        {fields.length > 5 && (
          <div className="text-xs text-muted-foreground pl-5">
            +{fields.length - 5} more...
          </div>
        )}
      </div>
    </div>
  )
}
