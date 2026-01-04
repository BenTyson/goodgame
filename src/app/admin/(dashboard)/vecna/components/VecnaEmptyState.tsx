'use client'

import { Wand2, Download, ExternalLink } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import Link from 'next/link'

interface VecnaEmptyStateProps {
  stats: {
    total: number
    published: number
    needsReview: number
    missingRulebook: number
    processing: number
  }
  hasSelection: boolean
}

export function VecnaEmptyState({ stats, hasSelection }: VecnaEmptyStateProps) {
  if (hasSelection) {
    // Selection made but no game selected (empty family or standalone list)
    return (
      <div className="flex items-center justify-center h-full p-8">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <CardTitle>No Games</CardTitle>
            <CardDescription>
              This selection has no games to process.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    )
  }

  // No selection yet - welcome screen
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 space-y-8">
      {/* Hero */}
      <div className="text-center max-w-xl">
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mb-4">
          <Wand2 className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome to Vecna</h1>
        <p className="text-muted-foreground">
          The automated game content pipeline. Select a family from the sidebar to begin processing,
          or import new games from BoardGameGeek.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-2xl">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{stats.total}</div>
            <div className="text-xs text-muted-foreground">Total Games</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{stats.published}</div>
            <div className="text-xs text-muted-foreground">Published</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{stats.needsReview}</div>
            <div className="text-xs text-muted-foreground">Ready for Review</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{stats.missingRulebook}</div>
            <div className="text-xs text-muted-foreground">Missing Rulebook</div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link href="/admin/import">
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Import from BGG
          </Button>
        </Link>
        <Link href="/admin/families">
          <Button variant="outline" className="gap-2">
            <ExternalLink className="h-4 w-4" />
            Manage Families
          </Button>
        </Link>
      </div>

      {/* Pipeline Overview */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-lg">Pipeline Stages</CardTitle>
          <CardDescription>
            Each game progresses through these stages automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs font-medium">1</div>
              <div>
                <div className="font-medium">Import & Enrich</div>
                <div className="text-muted-foreground text-xs">BGG + Wikidata + Wikipedia</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-blue-200 flex items-center justify-center text-xs font-medium">2</div>
              <div>
                <div className="font-medium">Family Review</div>
                <div className="text-muted-foreground text-xs">Confirm relations, add rulebooks</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-violet-200 flex items-center justify-center text-xs font-medium">3</div>
              <div>
                <div className="font-medium">Parse & Categorize</div>
                <div className="text-muted-foreground text-xs">Extract rules, assign taxonomy</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-cyan-200 flex items-center justify-center text-xs font-medium">4</div>
              <div>
                <div className="font-medium">Generate Content</div>
                <div className="text-muted-foreground text-xs">AI-powered guides & references</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-amber-200 flex items-center justify-center text-xs font-medium">5</div>
              <div>
                <div className="font-medium">Review & Approve</div>
                <div className="text-muted-foreground text-xs">Human quality check</div>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-6 w-6 rounded-full bg-green-200 flex items-center justify-center text-xs font-medium">6</div>
              <div>
                <div className="font-medium">Publish</div>
                <div className="text-muted-foreground text-xs">Go live per-game</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
