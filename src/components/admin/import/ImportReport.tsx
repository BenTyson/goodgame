'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  CheckCircle2,
  XCircle,
  RefreshCw,
  Clock,
  ArrowRight,
  Plus,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  List,
  Users2,
} from 'lucide-react'
import type { ImportSummary, ImportProgress } from './ImportWizard'

interface ImportReportProps {
  summary: ImportSummary
  items: ImportProgress[]
  onStartOver: () => void
}

export function ImportReport({ summary, items, onStartOver }: ImportReportProps) {
  const [showSuccessful, setShowSuccessful] = useState(true)
  const [showFailed, setShowFailed] = useState(true)

  const successfulItems = items.filter((i) => i.status === 'success')
  const syncedItems = items.filter((i) => i.status === 'success' && i.gameId)
  const failedItems = items.filter((i) => i.status === 'failed')
  const skippedItems = items.filter((i) => i.status === 'skipped')

  // Check if all successful items belong to the same family
  const itemsWithFamily = successfulItems.filter((i) => i.familyId)
  const uniqueFamilyIds = new Set(itemsWithFamily.map((i) => i.familyId))
  const hasSingleFamily = uniqueFamilyIds.size === 1 && itemsWithFamily.length > 0
  const primaryFamily = hasSingleFamily
    ? { id: itemsWithFamily[0].familyId!, name: itemsWithFamily[0].familyName! }
    : null

  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds.toFixed(1)}s`
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = seconds % 60
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`
  }

  const totalSuccess = summary.imported + summary.synced

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div
          className={`h-10 w-10 rounded-lg flex items-center justify-center ${
            summary.failed === 0 ? 'bg-green-500/10' : 'bg-amber-500/10'
          }`}
        >
          {summary.failed === 0 ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-amber-500" />
          )}
        </div>
        <div>
          <h1 className="text-2xl font-bold">Import Complete</h1>
          <p className="text-muted-foreground">
            {summary.failed === 0
              ? 'All games were imported successfully'
              : `Completed with ${summary.failed} error${summary.failed !== 1 ? 's' : ''}`}
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="flex items-center gap-3 p-3 bg-green-500/10 rounded-lg">
              <Plus className="h-5 w-5 text-green-600" />
              <div>
                <p className="text-2xl font-bold text-green-600">{summary.imported}</p>
                <p className="text-sm text-muted-foreground">Imported</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
              <RefreshCw className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-2xl font-bold text-blue-600">{summary.synced}</p>
                <p className="text-sm text-muted-foreground">Synced</p>
              </div>
            </div>
            {summary.skipped > 0 && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-2xl font-bold">{summary.skipped}</p>
                  <p className="text-sm text-muted-foreground">Skipped</p>
                </div>
              </div>
            )}
            {summary.failed > 0 && (
              <div className="flex items-center gap-3 p-3 bg-red-500/10 rounded-lg">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <p className="text-2xl font-bold text-red-600">{summary.failed}</p>
                  <p className="text-sm text-muted-foreground">Failed</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <Clock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-2xl font-bold">{formatDuration(summary.duration)}</p>
                <p className="text-sm text-muted-foreground">Duration</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Successful Items */}
      {successfulItems.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Successful ({successfulItems.length})
                </CardTitle>
                <CardDescription>Games that were imported or synced</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSuccessful(!showSuccessful)}
              >
                {showSuccessful ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {showSuccessful && (
            <CardContent>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {successfulItems.map((item) => (
                  <div
                    key={item.bggId}
                    className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {item.slug && (
                        <Link href={`/admin/games/${item.gameId}`}>
                          <Button variant="ghost" size="sm" className="gap-1 h-7">
                            Edit
                            <ArrowRight className="h-3 w-3" />
                          </Button>
                        </Link>
                      )}
                      <a
                        href={`https://boardgamegeek.com/boardgame/${item.bggId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Failed Items */}
      {failedItems.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  Failed ({failedItems.length})
                </CardTitle>
                <CardDescription>Games that could not be imported</CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFailed(!showFailed)}
              >
                {showFailed ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardHeader>
          {showFailed && (
            <CardContent>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {failedItems.map((item) => (
                  <div
                    key={item.bggId}
                    className="flex items-center justify-between p-2 rounded-lg bg-red-500/5"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <XCircle className="h-4 w-4 text-red-500 shrink-0" />
                      <span className="truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="destructive" className="text-xs">
                        {item.error || 'Failed'}
                      </Badge>
                      <a
                        href={`https://boardgamegeek.com/boardgame/${item.bggId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-foreground"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onStartOver} className="gap-2">
          <Plus className="h-4 w-4" />
          Import More
        </Button>
        <div className="flex gap-2">
          {primaryFamily && (
            <Link href={`/admin/families/${primaryFamily.id}`}>
              <Button className="gap-2">
                <Users2 className="h-4 w-4" />
                Configure Family
              </Button>
            </Link>
          )}
          <Link href="/admin/games">
            <Button variant={primaryFamily ? 'outline' : 'default'} className="gap-2">
              <List className="h-4 w-4" />
              Games List
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
