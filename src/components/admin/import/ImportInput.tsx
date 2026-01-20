'use client'

import { Download } from 'lucide-react'
import { PuffinBrowser } from './PuffinBrowser'
import type { RelationMode } from './ImportWizard'

interface ImportInputProps {
  onPuffinImport: (bggIds: number[], relationMode: RelationMode) => void
  onPuffinQuickImport: (bggIds: number[]) => void
}

export function ImportInput({ onPuffinImport, onPuffinQuickImport }: ImportInputProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Download className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Import Games</h1>
          <p className="text-muted-foreground">Browse and import games from Puffin cache</p>
        </div>
      </div>

      {/* Puffin Browser */}
      <PuffinBrowser
        onImport={onPuffinImport}
        onQuickImport={onPuffinQuickImport}
      />
    </div>
  )
}
