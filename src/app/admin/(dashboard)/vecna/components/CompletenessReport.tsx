'use client'

import { useState, useMemo } from 'react'
import {
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Info,
  Database,
  FileText,
  Tags,
  BookOpen,
  ListChecks,
  ClipboardList,
  Image as ImageIcon,
  AlertCircle,
  CircleDot,
  Building,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import type { VecnaGame } from '@/lib/vecna'
import {
  generateCompletenessReport,
  getImportanceColor,
  getImportanceLabel,
  getStatusColor,
  type CompletenessReport as ReportType,
  type FieldCategory,
  type FieldImportance,
} from '@/lib/vecna/completeness'

interface CompletenessReportProps {
  game: VecnaGame
  defaultExpanded?: boolean
}

// Icon mapping
const categoryIcons: Record<string, React.ElementType> = {
  Info,
  Database,
  FileText,
  Tags,
  BookOpen,
  ListChecks,
  ClipboardList,
  Image: ImageIcon,
  Building,
}

// Importance icon
function ImportanceIcon({ importance }: { importance: FieldImportance }) {
  switch (importance) {
    case 'critical':
      return <XCircle className="h-3.5 w-3.5 text-red-500" />
    case 'important':
      return <AlertTriangle className="h-3.5 w-3.5 text-amber-500" />
    case 'recommended':
      return <AlertCircle className="h-3.5 w-3.5 text-blue-500" />
    case 'optional':
      return <CircleDot className="h-3.5 w-3.5 text-slate-400" />
  }
}

// Category section component
function CategorySection({ category, defaultOpen = false }: { category: FieldCategory; defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  const Icon = categoryIcons[category.icon] || Info

  const missingCount = category.fields.filter(f => !f.present).length
  const hasMissing = missingCount > 0

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <button
          className={cn(
            'w-full flex items-center justify-between p-3 rounded-lg border transition-colors',
            'hover:bg-muted/50',
            category.criticalMissing > 0
              ? 'border-red-200 bg-red-50/50'
              : category.importantMissing > 0
                ? 'border-amber-200 bg-amber-50/50'
                : 'border-border'
          )}
        >
          <div className="flex items-center gap-3">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <div className="text-left">
              <div className="font-medium text-sm">{category.name}</div>
              <div className="text-xs text-muted-foreground">{category.description}</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Stats */}
            <div className="text-right">
              <div className="flex items-center gap-2">
                <span className={cn(
                  'text-sm font-medium',
                  category.completionPercent === 100 ? 'text-green-600' : 'text-muted-foreground'
                )}>
                  {category.completionPercent}%
                </span>
                {hasMissing && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'text-xs',
                      category.criticalMissing > 0
                        ? 'bg-red-100 text-red-700'
                        : category.importantMissing > 0
                          ? 'bg-amber-100 text-amber-700'
                          : 'bg-blue-100 text-blue-700'
                    )}
                  >
                    {missingCount} missing
                  </Badge>
                )}
              </div>
            </div>
            {isOpen ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="mt-2 ml-7 space-y-1">
          {category.fields.map((field) => (
            <div
              key={field.field}
              className={cn(
                'flex items-center justify-between p-2 rounded text-sm',
                !field.present && 'bg-muted/30'
              )}
            >
              <div className="flex items-center gap-2">
                {field.present ? (
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                ) : (
                  <ImportanceIcon importance={field.importance} />
                )}
                <span className={cn(!field.present && 'text-muted-foreground')}>
                  {field.label}
                </span>
                {!field.present && (
                  <Badge
                    variant="outline"
                    className={cn('text-[10px] py-0', getImportanceColor(field.importance))}
                  >
                    {getImportanceLabel(field.importance)}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-2">
                {field.note && (
                  <span className="text-xs text-muted-foreground">{field.note}</span>
                )}
                {field.source && !field.present && (
                  <span className="text-[10px] text-muted-foreground/60">
                    via {field.source}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

// Summary badges
function SummaryBadges({ report }: { report: ReportType }) {
  return (
    <div className="flex flex-wrap gap-2">
      {report.criticalMissing.length > 0 && (
        <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
          <XCircle className="h-3 w-3 mr-1" />
          {report.criticalMissing.length} Critical
        </Badge>
      )}
      {report.importantMissing.length > 0 && (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
          <AlertTriangle className="h-3 w-3 mr-1" />
          {report.importantMissing.length} Important
        </Badge>
      )}
      {report.recommendedMissing.length > 0 && (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          <AlertCircle className="h-3 w-3 mr-1" />
          {report.recommendedMissing.length} Recommended
        </Badge>
      )}
      {report.summary.status === 'complete' && (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle2 className="h-3 w-3 mr-1" />
          Ready
        </Badge>
      )}
    </div>
  )
}

export function CompletenessReport({ game, defaultExpanded = false }: CompletenessReportProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [showAll, setShowAll] = useState(false)

  // Generate report
  const report = useMemo(() => generateCompletenessReport(game), [game])

  // Filter categories to show
  const categoriesToShow = useMemo(() => {
    if (showAll) return report.categories
    // By default, only show categories with missing fields
    return report.categories.filter(c => c.completionPercent < 100)
  }, [report.categories, showAll])

  const categoriesWithMissing = report.categories.filter(c => c.completionPercent < 100).length
  const allComplete = report.summary.status === 'complete' && report.recommendedMissing.length === 0

  return (
    <Card className={cn(
      'border-2',
      report.summary.status === 'incomplete'
        ? 'border-red-200'
        : report.summary.status === 'needs_attention'
          ? 'border-amber-200'
          : 'border-green-200'
    )}>
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <CardHeader className="cursor-pointer hover:bg-muted/30 transition-colors pb-3">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <CardTitle className="text-base flex items-center gap-2">
                  {report.summary.status === 'complete' ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : report.summary.status === 'incomplete' ? (
                    <XCircle className="h-5 w-5 text-red-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500" />
                  )}
                  Data Completeness Report
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  {report.summary.message}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-2xl font-bold">{report.overallPercent}%</div>
                  <div className="text-xs text-muted-foreground">
                    {report.presentFields}/{report.totalFields} fields
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </div>
            </div>
            {!isExpanded && (
              <div className="mt-3">
                <SummaryBadges report={report} />
              </div>
            )}
          </CardHeader>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Progress bar */}
            <div className="space-y-1">
              <Progress value={report.overallPercent} className="h-2" />
              <SummaryBadges report={report} />
            </div>

            {/* Quick summary of critical missing */}
            {report.criticalMissing.length > 0 && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-sm font-medium text-red-800 mb-2 flex items-center gap-2">
                  <XCircle className="h-4 w-4" />
                  Critical Missing Fields
                </h4>
                <ul className="space-y-1">
                  {report.criticalMissing.map((field) => (
                    <li key={field.field} className="text-sm text-red-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                      <span className="font-medium">{field.label}</span>
                      {field.source && (
                        <span className="text-red-500/70 text-xs">({field.source})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Important missing summary */}
            {report.importantMissing.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg">
                <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  Important Missing Fields
                </h4>
                <ul className="space-y-1">
                  {report.importantMissing.map((field) => (
                    <li key={field.field} className="text-sm text-amber-700 flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                      <span className="font-medium">{field.label}</span>
                      {field.source && (
                        <span className="text-amber-500/70 text-xs">({field.source})</span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Category breakdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium">
                  {showAll ? 'All Categories' : 'Categories Needing Attention'}
                </h4>
                {categoriesWithMissing < report.categories.length && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAll(!showAll)}
                    className="text-xs"
                  >
                    {showAll ? 'Show Issues Only' : `Show All (${report.categories.length})`}
                  </Button>
                )}
              </div>

              {categoriesToShow.length === 0 ? (
                <div className="text-center py-4 text-sm text-muted-foreground">
                  <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                  All fields are populated!
                </div>
              ) : (
                <div className="space-y-2">
                  {categoriesToShow.map((category) => (
                    <CategorySection
                      key={category.name}
                      category={category}
                      defaultOpen={category.criticalMissing > 0}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Footer note */}
            <div className="text-xs text-muted-foreground border-t pt-3">
              <p>
                <strong>Critical:</strong> Required for game to function on the site.{' '}
                <strong>Important:</strong> Should be filled for quality content.{' '}
                <strong>Recommended:</strong> Nice to have for completeness.
              </p>
            </div>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  )
}
