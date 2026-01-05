'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
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
  // Only shows when there are truly no games
  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
      <p className="text-muted-foreground mb-4">
        {stats.total === 0
          ? 'No games in the pipeline yet.'
          : 'No games match your current filter.'}
      </p>
      {stats.total === 0 && (
        <Link href="/admin/import">
          <Button className="gap-2">
            <Download className="h-4 w-4" />
            Import from BGG
          </Button>
        </Link>
      )}
    </div>
  )
}
