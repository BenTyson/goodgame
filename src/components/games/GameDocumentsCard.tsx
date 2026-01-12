'use client'

import {
  FileText,
  BookOpen,
  HelpCircle,
  Palette,
  Boxes,
  PlayCircle,
  File,
  ExternalLink,
  ScrollText,
} from 'lucide-react'
import type { GameDocument, DocumentType } from '@/types/database'

// Icon mapping for document types
const DOCUMENT_TYPE_ICONS: Record<DocumentType, typeof FileText> = {
  gameplay_guide: PlayCircle,
  glossary: ScrollText,
  icon_overview: Palette,
  setup_guide: Boxes,
  faq: HelpCircle,
  misc: File,
}

// Labels for document types
const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  gameplay_guide: 'Gameplay Guide',
  glossary: 'Glossary',
  icon_overview: 'Icon Overview',
  setup_guide: 'Setup Guide',
  faq: 'FAQ',
  misc: 'Document',
}

interface GameDocumentsCardProps {
  documents: GameDocument[]
  rulebookUrl?: string | null
}

export function GameDocumentsCard({ documents, rulebookUrl }: GameDocumentsCardProps) {
  // Don't render if no documents and no rulebook
  if (documents.length === 0 && !rulebookUrl) return null

  return (
    <div className="rounded-2xl border border-border/50 bg-card/50 backdrop-blur p-6 space-y-4">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
        <FileText className="h-4 w-4" />
        Resources
      </h3>

      <div className="space-y-2">
        {/* Official Rulebook - always first if present */}
        {rulebookUrl && (
          <a
            href={rulebookUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
          >
            <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-teal-500/15 text-teal-500">
              <BookOpen className="h-4 w-4" />
            </div>
            <p className="flex-1 min-w-0 text-sm font-medium uppercase tracking-wide truncate">Official Rulebook</p>
            <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
          </a>
        )}

        {/* Supplementary Documents */}
        {documents.map((doc) => {
          const Icon = DOCUMENT_TYPE_ICONS[doc.document_type as DocumentType] || File
          const label = DOCUMENT_TYPE_LABELS[doc.document_type as DocumentType] || 'Document'

          return (
            <a
              key={doc.id}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 p-2.5 -mx-2.5 rounded-lg hover:bg-muted/50 transition-colors group"
            >
              <div className="flex items-center justify-center h-9 w-9 rounded-lg bg-teal-500/10 text-teal-500">
                <Icon className="h-4 w-4" />
              </div>
              <p className="flex-1 min-w-0 text-sm font-medium uppercase tracking-wide truncate">{label}</p>
              <ExternalLink className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          )
        })}
      </div>
    </div>
  )
}
