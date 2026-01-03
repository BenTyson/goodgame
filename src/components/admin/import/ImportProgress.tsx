'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react'
import type { ImportProgress as ImportProgressItem } from './ImportWizard'

interface ImportProgressProps {
  items: ImportProgressItem[]
  totalCount: number
}

export function ImportProgress({ items, totalCount }: ImportProgressProps) {
  const completedCount = items.filter(
    (i) => i.status === 'success' || i.status === 'failed' || i.status === 'skipped'
  ).length

  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0

  const currentItem = items.find(
    (i) => i.status === 'importing' || i.status === 'syncing'
  )

  const getStatusIcon = (status: ImportProgressItem['status']) => {
    switch (status) {
      case 'importing':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
      case 'syncing':
        return <RefreshCw className="h-4 w-4 animate-spin text-blue-500" />
      case 'success':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />
      case 'skipped':
        return <Clock className="h-4 w-4 text-muted-foreground" />
    }
  }

  const getStatusText = (status: ImportProgressItem['status']) => {
    switch (status) {
      case 'importing':
        return 'Importing...'
      case 'syncing':
        return 'Syncing...'
      case 'success':
        return 'Done'
      case 'failed':
        return 'Failed'
      case 'skipped':
        return 'Skipped'
    }
  }

  // Separate items into different sections
  const pendingItems = items.filter(
    (i) => i.status === 'importing' || i.status === 'syncing'
  )
  const completedItems = items.filter((i) => i.status === 'success')
  const failedItems = items.filter((i) => i.status === 'failed')

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
          <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Importing...</h1>
          <p className="text-muted-foreground">
            Please wait while games are being imported
          </p>
        </div>
      </div>

      {/* Progress Card */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Progress</CardTitle>
            <span className="text-sm text-muted-foreground">
              {completedCount} / {totalCount} games
            </span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <Progress value={progressPercent} className="h-3" />

          {currentItem && (
            <div className="flex items-center gap-3 p-3 bg-blue-500/10 rounded-lg">
              <Loader2 className="h-5 w-5 text-blue-500 animate-spin shrink-0" />
              <div className="min-w-0">
                <p className="font-medium truncate">{currentItem.name}</p>
                <p className="text-sm text-muted-foreground">
                  {currentItem.status === 'syncing' ? 'Syncing with BGG...' : 'Importing from BGG...'}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Import Log</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {items.map((item) => (
              <div
                key={item.bggId}
                className={`flex items-center justify-between p-2 rounded-lg ${
                  item.status === 'importing' || item.status === 'syncing'
                    ? 'bg-blue-500/10'
                    : item.status === 'success'
                    ? 'bg-green-500/5'
                    : item.status === 'failed'
                    ? 'bg-red-500/5'
                    : 'bg-muted/30'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  {getStatusIcon(item.status)}
                  <span className="truncate">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {item.error && (
                    <span className="text-xs text-red-500 max-w-32 truncate" title={item.error}>
                      {item.error}
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground">
                    {getStatusText(item.status)}
                  </span>
                </div>
              </div>
            ))}

            {/* Placeholder for remaining items */}
            {items.length < totalCount && (
              <div className="flex items-center gap-3 p-2 text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span className="text-sm">
                  {totalCount - items.length} more game{totalCount - items.length !== 1 ? 's' : ''} waiting...
                </span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <div className="flex items-center gap-2 p-3 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg">
        <AlertTriangle className="h-4 w-4 shrink-0" />
        <p className="text-sm">Do not close this page during import</p>
      </div>
    </div>
  )
}
