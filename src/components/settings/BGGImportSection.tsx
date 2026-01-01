'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import {
  Upload,
  Loader2,
  FileText,
  CheckCircle2,
  AlertCircle,
  X,
  ExternalLink,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'

interface PreviewData {
  totalInCSV: number
  matched: number
  unmatched: number
  preview: {
    wouldImport: number
    wouldUpdate: number
    wouldSkip: number
  }
  unmatchedGames: { bggId: number; name: string }[]
  warnings: string[]
}

interface ImportResult {
  imported: number
  updated: number
  skipped: number
  unmatched: number
  unmatchedGames: { bggId: number; name: string }[]
  errors: string[]
}

type ImportState = 'idle' | 'uploading' | 'previewing' | 'importing' | 'done' | 'error'

export function BGGImportSection() {
  const [state, setState] = useState<ImportState>('idle')
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [preview, setPreview] = useState<PreviewData | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [showUnmatched, setShowUnmatched] = useState(false)

  // Import options
  const [overwriteExisting, setOverwriteExisting] = useState(false)
  const [importRatings, setImportRatings] = useState(true)
  const [importNotes, setImportNotes] = useState(true)

  const reset = () => {
    setState('idle')
    setFile(null)
    setError(null)
    setPreview(null)
    setResult(null)
    setShowUnmatched(false)
  }

  const uploadForPreview = async (selectedFile: File) => {
    setState('uploading')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('mode', 'preview')

      const response = await fetch('/api/user/import/bgg', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.errors?.[0] || 'Preview failed')
      }

      setPreview(data)
      setFile(selectedFile)
      setState('previewing')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse CSV')
      setState('error')
    }
  }

  const performImport = async () => {
    if (!file) return

    setState('importing')
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('mode', 'import')
      formData.append('overwriteExisting', overwriteExisting.toString())
      formData.append('importRatings', importRatings.toString())
      formData.append('importNotes', importNotes.toString())

      const response = await fetch('/api/user/import/bgg', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || data.errors?.[0] || 'Import failed')
      }

      setResult(data)
      setState('done')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setState('error')
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return
    uploadForPreview(files[0])
    e.target.value = ''
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(
      (f) => f.name.endsWith('.csv') || f.type === 'text/csv'
    )
    if (files.length === 0) {
      setError('Please drop a CSV file')
      return
    }
    uploadForPreview(files[0])
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Import from BoardGameGeek
        </CardTitle>
        <CardDescription>
          Import your BGG collection by uploading your collection export CSV
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Instructions */}
        {state === 'idle' && (
          <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
            <p className="font-medium">How to export from BGG:</p>
            <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
              <li>
                Go to{' '}
                <a
                  href="https://boardgamegeek.com/collection/user/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline inline-flex items-center gap-1"
                >
                  your BGG collection page
                  <ExternalLink className="h-3 w-3" />
                </a>
              </li>
              <li>Look for the &quot;Download&quot; link in the upper right area (next to Permalink)</li>
              <li>Click &quot;all&quot; or &quot;owned&quot; to download your CSV, then upload it below</li>
            </ol>
          </div>
        )}

        {/* Upload zone - only show in idle/error states */}
        {(state === 'idle' || state === 'error') && (
          <>
            <div
              className={`border-2 border-dashed rounded-lg transition-colors ${
                dragOver
                  ? 'border-primary bg-primary/5'
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileChange}
                className="hidden"
                id="bgg-csv-upload"
              />
              <label htmlFor="bgg-csv-upload" className="cursor-pointer block">
                <div className="flex flex-col items-center justify-center gap-2 py-8">
                  <FileText className="h-8 w-8 text-muted-foreground" />
                  <div className="text-center">
                    <p className="text-sm font-medium">
                      Drop your BGG collection CSV here or click to upload
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      CSV files up to 5MB
                    </p>
                  </div>
                </div>
              </label>
            </div>

            {error && (
              <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
                <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Import Error</p>
                  <p className="text-sm">{error}</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Uploading state */}
        {state === 'uploading' && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Analyzing CSV...</span>
          </div>
        )}

        {/* Preview state */}
        {state === 'previewing' && preview && (
          <div className="space-y-4">
            {/* Stats summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {preview.preview.wouldImport}
                </div>
                <div className="text-xs text-muted-foreground">New Games</div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {preview.preview.wouldUpdate}
                </div>
                <div className="text-xs text-muted-foreground">Would Update</div>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {preview.unmatched}
                </div>
                <div className="text-xs text-muted-foreground">Not in DB</div>
              </div>
            </div>

            <p className="text-sm text-muted-foreground">
              Found {preview.totalInCSV} games in your CSV. {preview.matched} games
              matched to our database.
            </p>

            {/* Import options */}
            <div className="space-y-3 border-t pt-4">
              <p className="text-sm font-medium">Import Options</p>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="overwrite"
                    checked={overwriteExisting}
                    onCheckedChange={(checked) =>
                      setOverwriteExisting(checked === true)
                    }
                  />
                  <Label htmlFor="overwrite" className="text-sm font-normal">
                    Overwrite existing shelf entries
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="ratings"
                    checked={importRatings}
                    onCheckedChange={(checked) => setImportRatings(checked === true)}
                  />
                  <Label htmlFor="ratings" className="text-sm font-normal">
                    Import ratings from BGG
                  </Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="notes"
                    checked={importNotes}
                    onCheckedChange={(checked) => setImportNotes(checked === true)}
                  />
                  <Label htmlFor="notes" className="text-sm font-normal">
                    Import comments as notes
                  </Label>
                </div>
              </div>
            </div>

            {/* Unmatched games expandable */}
            {preview.unmatchedGames.length > 0 && (
              <div className="border rounded-lg">
                <button
                  onClick={() => setShowUnmatched(!showUnmatched)}
                  className="w-full flex items-center justify-between p-3 hover:bg-muted/50 transition-colors"
                >
                  <span className="text-sm font-medium">
                    {preview.unmatched} games not in our database
                  </span>
                  {showUnmatched ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
                {showUnmatched && (
                  <div className="border-t p-3 max-h-48 overflow-y-auto">
                    <ul className="text-sm text-muted-foreground space-y-1">
                      {preview.unmatchedGames.map((game) => (
                        <li key={game.bggId} className="flex items-center justify-between">
                          <span className="truncate">{game.name}</span>
                          <a
                            href={`https://boardgamegeek.com/boardgame/${game.bggId}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline flex-shrink-0 ml-2"
                          >
                            BGG
                          </a>
                        </li>
                      ))}
                      {preview.unmatched > preview.unmatchedGames.length && (
                        <li className="text-xs italic">
                          ...and {preview.unmatched - preview.unmatchedGames.length} more
                        </li>
                      )}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Warnings */}
            {preview.warnings.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
                <p className="text-sm font-medium text-amber-600 dark:text-amber-400 mb-1">
                  Warnings
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {preview.warnings.slice(0, 5).map((warning, i) => (
                    <li key={i}>{warning}</li>
                  ))}
                  {preview.warnings.length > 5 && (
                    <li className="italic">
                      ...and {preview.warnings.length - 5} more
                    </li>
                  )}
                </ul>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-3 pt-2">
              <Button onClick={performImport} disabled={preview.matched === 0}>
                Import {preview.matched} Games
              </Button>
              <Button variant="outline" onClick={reset}>
                Cancel
              </Button>
            </div>
          </div>
        )}

        {/* Importing state */}
        {state === 'importing' && (
          <div className="flex items-center justify-center gap-3 py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
            <span className="text-muted-foreground">Importing games...</span>
          </div>
        )}

        {/* Done state */}
        {state === 'done' && result && (
          <div className="space-y-4">
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-green-600 dark:text-green-400">
                  Import Complete!
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Added {result.imported} new games
                  {result.updated > 0 && `, updated ${result.updated} existing`}
                  {result.skipped > 0 && `, skipped ${result.skipped}`}
                </p>
              </div>
            </div>

            {result.unmatched > 0 && (
              <p className="text-sm text-muted-foreground">
                {result.unmatched} games from your BGG collection are not yet in our
                database. They will be automatically added as we expand our catalog.
              </p>
            )}

            {result.errors.length > 0 && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
                <p className="text-sm font-medium text-destructive mb-1">
                  Some errors occurred
                </p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {result.errors.map((err, i) => (
                    <li key={i}>{err}</li>
                  ))}
                </ul>
              </div>
            )}

            <Button onClick={reset} variant="outline">
              <X className="h-4 w-4 mr-2" />
              Close
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
