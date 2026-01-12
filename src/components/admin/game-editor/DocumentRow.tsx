'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FileText, ExternalLink, Trash2, Loader2 } from 'lucide-react'
import { DOCUMENT_TYPE_LABELS, type GameDocument, type DocumentType } from '@/types/database'

interface DocumentRowProps {
  document: GameDocument
  onDelete: (id: string, storagePath: string | null) => Promise<void>
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentRow({ document, onDelete }: DocumentRowProps) {
  const [deleting, setDeleting] = useState(false)

  const handleDelete = async () => {
    if (deleting) return
    setDeleting(true)
    try {
      await onDelete(document.id, document.storage_path)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
      <FileText className="h-5 w-5 text-muted-foreground flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="font-medium text-sm truncate">{document.title}</div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="px-1.5 py-0.5 bg-primary/10 rounded text-primary">
            {DOCUMENT_TYPE_LABELS[document.document_type as DocumentType]}
          </span>
          {document.file_size && (
            <span>{formatFileSize(document.file_size)}</span>
          )}
          {document.page_count && (
            <span>{document.page_count} pages</span>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1">
        <a href={document.url} target="_blank" rel="noopener noreferrer">
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <ExternalLink className="h-4 w-4" />
          </Button>
        </a>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={deleting}
        >
          {deleting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Trash2 className="h-4 w-4" />
          )}
        </Button>
      </div>
    </div>
  )
}
