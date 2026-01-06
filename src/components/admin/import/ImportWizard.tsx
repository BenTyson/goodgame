'use client'

import { useState, useCallback } from 'react'
import { ImportInput } from './ImportInput'
import { ImportPreview } from './ImportPreview'
import { ImportProgress } from './ImportProgress'
import { ImportReport } from './ImportReport'

export type ImportState = 'input' | 'preview' | 'progress' | 'report'

export type RelationMode = 'all' | 'upstream' | 'none'

export interface GameAnalysis {
  bggId: number
  name: string
  year: number | null
  rank: number | null
  rating: number
  status: 'new' | 'exists' | 'error'
  existingGameId?: string
  existingSlug?: string
  error?: string
  expansionCount: number
  baseGameCount: number
  reimplementationCount: number
}

export interface RelationGame {
  bggId: number
  name: string
  year?: number | null
}

export interface AnalyzeResult {
  games: GameAnalysis[]
  relations: {
    expansions: number
    baseGames: number
    reimplementations: number
  }
  relationsDetail: {
    expansions: RelationGame[]
    baseGames: RelationGame[]
    reimplementations: RelationGame[]
  }
  totals: {
    new: number
    existing: number
    failed: number
    estimatedSeconds: number
  }
}

export interface ImportProgress {
  bggId: number
  name: string
  status: 'importing' | 'syncing' | 'success' | 'failed' | 'skipped'
  error?: string
  gameId?: string
  slug?: string
  familyId?: string
  familyName?: string
}

export interface ImportSummary {
  imported: number
  synced: number
  failed: number
  skipped: number
  duration: number
}

export interface ImportSettings {
  bggIds: number[]
  relationMode: RelationMode
  maxDepth: number
  resyncExisting: boolean
  excludedBggIds: number[]
}

export function ImportWizard() {
  const [state, setState] = useState<ImportState>('input')
  const [settings, setSettings] = useState<ImportSettings>({
    bggIds: [],
    relationMode: 'all',
    maxDepth: 3,
    resyncExisting: true,
    excludedBggIds: [],
  })
  const [analyzeResult, setAnalyzeResult] = useState<AnalyzeResult | null>(null)
  const [progressItems, setProgressItems] = useState<ImportProgress[]>([])
  const [summary, setSummary] = useState<ImportSummary | null>(null)

  const handleAnalyze = useCallback(async (newSettings: ImportSettings) => {
    setSettings(newSettings)

    try {
      const response = await fetch('/api/admin/import/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bggIds: newSettings.bggIds,
          relationMode: newSettings.relationMode,
          maxDepth: newSettings.maxDepth,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Analysis failed')
      }

      const result: AnalyzeResult = await response.json()
      setAnalyzeResult(result)
      setState('preview')
    } catch (error) {
      console.error('Analysis failed:', error)
      throw error
    }
  }, [])

  const handleStartImport = useCallback(async () => {
    setState('progress')
    setProgressItems([])
    setSummary(null)

    try {
      const response = await fetch('/api/admin/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bggIds: settings.bggIds,
          relationMode: settings.relationMode,
          maxDepth: settings.maxDepth,
          resyncExisting: settings.resyncExisting,
          excludedBggIds: settings.excludedBggIds,
        }),
      })

      if (!response.ok) {
        throw new Error('Import failed to start')
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response stream')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const event = JSON.parse(line.slice(6))

              if (event.type === 'progress') {
                setProgressItems(prev => {
                  // Update existing or add new
                  const existing = prev.findIndex(p => p.bggId === event.bggId)
                  if (existing >= 0) {
                    const updated = [...prev]
                    updated[existing] = event
                    return updated
                  }
                  return [...prev, event]
                })
              } else if (event.type === 'complete') {
                setSummary(event.summary)
                setState('report')
              }
            } catch (e) {
              console.error('Failed to parse SSE event:', e)
            }
          }
        }
      }
    } catch (error) {
      console.error('Import failed:', error)
      // Move to report state with error
      setSummary({
        imported: 0,
        synced: 0,
        failed: settings.bggIds.length,
        skipped: 0,
        duration: 0,
      })
      setState('report')
    }
  }, [settings])

  const handleBack = useCallback(() => {
    if (state === 'preview') {
      setState('input')
    }
  }, [state])

  const handleStartOver = useCallback(() => {
    setState('input')
    setSettings({
      bggIds: [],
      relationMode: 'all',
      maxDepth: 3,
      resyncExisting: true,
      excludedBggIds: [],
    })
    setAnalyzeResult(null)
    setProgressItems([])
    setSummary(null)
  }, [])

  return (
    <div className="space-y-6">
      {state === 'input' && (
        <ImportInput
          initialSettings={settings}
          onAnalyze={handleAnalyze}
        />
      )}

      {state === 'preview' && analyzeResult && (
        <ImportPreview
          result={analyzeResult}
          settings={settings}
          onBack={handleBack}
          onStartImport={handleStartImport}
          onSettingsChange={setSettings}
        />
      )}

      {state === 'progress' && (
        <ImportProgress
          items={progressItems}
          totalCount={settings.bggIds.length}
        />
      )}

      {state === 'report' && summary && (
        <ImportReport
          summary={summary}
          items={progressItems}
          onStartOver={handleStartOver}
        />
      )}
    </div>
  )
}
