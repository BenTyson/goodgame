'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Download,
  Search,
  Loader2,
  AlertCircle,
  Sparkles,
} from 'lucide-react'
import type { ImportSettings, RelationMode } from './ImportWizard'

// BGG Top 100 IDs (curated from BGG rankings)
const BGG_TOP_IDS = [
  // Top 10
  174430, 161936, 224517, 167791, 233078, 187645, 169786, 182028, 115746, 220308,
  // 11-30
  12333, 164928, 84876, 31260, 173346, 205637, 28720, 162886, 102794, 230802,
  // 31-50
  183394, 193738, 3076, 68448, 2651, 35677, 126163, 25613, 237182, 175914,
  // 51-70
  199792, 36218, 170216, 110327, 124361, 172818, 121921, 150376, 148228, 172386,
  // 71-100
  209010, 155821, 185343, 154203, 163412, 167355, 266192, 221107, 184267, 256960,
  295947, 262712, 199561, 161533, 175155, 171623, 203416, 192291, 157354, 104162,
]

interface ImportInputProps {
  initialSettings: ImportSettings
  onAnalyze: (settings: ImportSettings) => Promise<void>
}

type ImportType = 'single' | 'batch'

export function ImportInput({ initialSettings, onAnalyze }: ImportInputProps) {
  const [importType, setImportType] = useState<ImportType>('single')
  const [singleId, setSingleId] = useState('')
  const [batchIds, setBatchIds] = useState('')
  const [relationMode, setRelationMode] = useState<RelationMode>(initialSettings.relationMode)
  const [maxDepth, setMaxDepth] = useState(initialSettings.maxDepth.toString())
  const [analyzing, setAnalyzing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Parse IDs from input
  const parseIds = (): number[] => {
    if (importType === 'single') {
      const id = parseInt(singleId.trim(), 10)
      return isNaN(id) || id <= 0 ? [] : [id]
    }

    // Parse batch: support comma-separated, newline-separated, or mixed
    return batchIds
      .split(/[\n,]+/)
      .map(s => parseInt(s.trim(), 10))
      .filter(n => !isNaN(n) && n > 0)
  }

  const parsedIds = parseIds()
  const hasValidInput = parsedIds.length > 0

  const handleAnalyze = async () => {
    if (!hasValidInput) return

    setAnalyzing(true)
    setError(null)

    try {
      const depth = parseInt(maxDepth, 10)
      await onAnalyze({
        bggIds: parsedIds,
        relationMode,
        maxDepth: isNaN(depth) ? 3 : depth,  // 0 means unlimited
        resyncExisting: true,
        excludedBggIds: [],
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed')
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAddPreset = (count: number) => {
    const ids = BGG_TOP_IDS.slice(0, count)
    setBatchIds(ids.join('\n'))
    setImportType('batch')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Import Games</h1>
          <p className="text-muted-foreground">Import games from BoardGameGeek</p>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Import Type Selection */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Import Type</CardTitle>
          <CardDescription>Choose how you want to import games</CardDescription>
        </CardHeader>
        <CardContent>
          <RadioGroup
            value={importType}
            onValueChange={(v) => setImportType(v as ImportType)}
            className="grid grid-cols-2 gap-4"
          >
            <Label
              htmlFor="single"
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                importType === 'single' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="single" id="single" />
              <div>
                <p className="font-medium">Single Game</p>
                <p className="text-sm text-muted-foreground">Import one game by BGG ID</p>
              </div>
            </Label>
            <Label
              htmlFor="batch"
              className={`flex items-center gap-3 p-4 border rounded-lg cursor-pointer transition-colors ${
                importType === 'batch' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
              }`}
            >
              <RadioGroupItem value="batch" id="batch" />
              <div>
                <p className="font-medium">Batch Import</p>
                <p className="text-sm text-muted-foreground">Import multiple games at once</p>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Input Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">
            {importType === 'single' ? 'Game ID' : 'Game IDs'}
          </CardTitle>
          <CardDescription>
            {importType === 'single'
              ? 'Enter the BGG ID of the game you want to import'
              : 'Enter BGG IDs (one per line or comma-separated)'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {importType === 'single' ? (
            <div className="flex gap-2">
              <Input
                type="number"
                placeholder="e.g., 174430"
                value={singleId}
                onChange={(e) => setSingleId(e.target.value)}
                className="max-w-xs"
              />
              <Button variant="outline" size="icon" disabled>
                <Search className="h-4 w-4" />
              </Button>
            </div>
          ) : (
            <>
              <Textarea
                placeholder="174430&#10;161936&#10;224517&#10;...or comma-separated: 174430, 161936, 224517"
                value={batchIds}
                onChange={(e) => setBatchIds(e.target.value)}
                rows={8}
                className="font-mono text-sm"
              />
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Quick Add:</span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPreset(25)}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Top 25
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPreset(50)}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Top 50
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleAddPreset(100)}
                  className="gap-1.5"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  Top 100
                </Button>
              </div>
            </>
          )}

          {parsedIds.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {parsedIds.length} game{parsedIds.length !== 1 ? 's' : ''} to analyze
            </p>
          )}
        </CardContent>
      </Card>

      {/* Options Card */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Import Options</CardTitle>
          <CardDescription>Configure how relations are handled</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Relation Mode */}
          <div className="space-y-3">
            <Label>Relations</Label>
            <RadioGroup
              value={relationMode}
              onValueChange={(v) => setRelationMode(v as RelationMode)}
              className="space-y-2"
            >
              <Label
                htmlFor="all"
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  relationMode === 'all' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="all" id="all" className="mt-0.5" />
                <div>
                  <p className="font-medium">All Relations</p>
                  <p className="text-sm text-muted-foreground">
                    Import all related games including expansions, base games, and reimplementations.
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="upstream"
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  relationMode === 'upstream' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="upstream" id="upstream" className="mt-0.5" />
                <div>
                  <p className="font-medium">Upstream Only</p>
                  <p className="text-sm text-muted-foreground">
                    Import parent/base games only. If importing an expansion, also imports the base game.
                  </p>
                </div>
              </Label>
              <Label
                htmlFor="none"
                className={`flex items-start gap-3 p-3 border rounded-lg cursor-pointer transition-colors ${
                  relationMode === 'none' ? 'border-primary bg-primary/5' : 'hover:bg-muted/50'
                }`}
              >
                <RadioGroupItem value="none" id="none" className="mt-0.5" />
                <div>
                  <p className="font-medium">No Relations</p>
                  <p className="text-sm text-muted-foreground">
                    Import only the specified games, no related games.
                  </p>
                </div>
              </Label>
            </RadioGroup>
          </div>

          {/* Max Depth */}
          {relationMode !== 'none' && (
            <div className="space-y-2">
              <Label htmlFor="maxDepth">Max Relation Depth</Label>
              <Select value={maxDepth} onValueChange={setMaxDepth}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 level</SelectItem>
                  <SelectItem value="2">2 levels</SelectItem>
                  <SelectItem value="3">3 levels</SelectItem>
                  <SelectItem value="4">4 levels</SelectItem>
                  <SelectItem value="5">5 levels</SelectItem>
                  <SelectItem value="0">All (no limit)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                How deep to follow relation chains (e.g., base game → expansion → mini-expansion)
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Analyze Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleAnalyze}
          disabled={!hasValidInput || analyzing}
          size="lg"
          className="gap-2"
        >
          {analyzing ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Search className="h-4 w-4" />
              Analyze Import
              {parsedIds.length > 0 && ` (${parsedIds.length})`}
            </>
          )}
        </Button>
      </div>
    </div>
  )
}
