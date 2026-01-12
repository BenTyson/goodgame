'use client'

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Files, Upload, FileText, Loader2 } from 'lucide-react'
import { DocumentRow } from './DocumentRow'
import { DOCUMENT_TYPE_LABELS, type GameDocument, type DocumentType } from '@/types/database'

interface SupplementaryDocumentsSectionProps {
  gameId: string
  gameSlug: string
}

export function SupplementaryDocumentsSection({
  gameId,
  gameSlug,
}: SupplementaryDocumentsSectionProps) {
  const [documents, setDocuments] = useState<GameDocument[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [selectedType, setSelectedType] = useState<DocumentType>('misc')
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Fetch documents on mount
  useEffect(() => {
    fetchDocuments()
  }, [gameId])

  const fetchDocuments = async () => {
    try {
      const response = await fetch(`/api/admin/game-documents?gameId=${gameId}`)
      if (!response.ok) throw new Error('Failed to fetch documents')
      const data = await response.json()
      setDocuments(data.documents || [])
    } catch (err) {
      console.error('Error fetching documents:', err)
      setError('Failed to load documents')
    } finally {
      setLoading(false)
    }
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Only PDF files are allowed')
      return
    }

    setUploading(true)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('gameId', gameId)
      formData.append('gameSlug', gameSlug)
      formData.append('documentType', selectedType)
      formData.append('title', file.name.replace('.pdf', ''))

      const response = await fetch('/api/admin/game-documents', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      setDocuments(prev => [...prev, data.document])
    } catch (err) {
      console.error('Upload error:', err)
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (documentId: string, storagePath: string | null) => {
    try {
      const response = await fetch('/api/admin/game-documents', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ documentId, storagePath }),
      })

      if (!response.ok) {
        throw new Error('Delete failed')
      }

      setDocuments(prev => prev.filter(d => d.id !== documentId))
    } catch (err) {
      console.error('Delete error:', err)
      setError('Failed to delete document')
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Files className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Supplementary Documents</CardTitle>
            <CardDescription className="text-xs">
              Additional guides, glossaries, and reference materials
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="flex items-center gap-3">
          <Select
            value={selectedType}
            onValueChange={(value) => setSelectedType(value as DocumentType)}
          >
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="relative">
            <Button variant="outline" disabled={uploading}>
              {uploading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Upload className="h-4 w-4 mr-2" />
              )}
              {uploading ? 'Uploading...' : 'Upload PDF'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="absolute inset-0 opacity-0 cursor-pointer disabled:cursor-not-allowed"
              onChange={handleFileSelect}
              disabled={uploading}
            />
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="text-sm text-destructive bg-destructive/10 px-3 py-2 rounded">
            {error}
          </div>
        )}

        {/* Documents List */}
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">
            <Loader2 className="h-6 w-6 mx-auto mb-2 animate-spin" />
            <p>Loading documents...</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>No supplementary documents uploaded.</p>
            <p className="text-xs mt-1">Upload guides, glossaries, FAQs, and more.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {documents.map((doc) => (
              <DocumentRow
                key={doc.id}
                document={doc}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
