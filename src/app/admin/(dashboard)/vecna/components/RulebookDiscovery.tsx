'use client'

import { useState, useRef } from 'react'
import {
  FileText,
  Search,
  ExternalLink,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Upload,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

interface RulebookDiscoveryProps {
  gameId: string
  gameSlug: string
  gameName: string
  currentRulebookUrl: string | null
  onRulebookSet: (url: string) => void
}

export function RulebookDiscovery({
  gameId,
  gameSlug,
  gameName,
  currentRulebookUrl,
  onRulebookSet,
}: RulebookDiscoveryProps) {
  const [isSetting, setIsSetting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [manualUrl, setManualUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const setRulebookUrl = async (url: string, source: string) => {
    setIsSetting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/vecna/${gameId}/discover-rulebook`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, source }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set URL')
      }

      onRulebookSet(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set URL')
    } finally {
      setIsSetting(false)
    }
  }

  const handleManualSubmit = () => {
    if (manualUrl.trim()) {
      setRulebookUrl(manualUrl.trim(), 'manual')
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }

    // Validate file size (50MB max)
    if (file.size > 50 * 1024 * 1024) {
      setError('File size exceeds 50MB limit')
      return
    }

    setIsUploading(true)
    setError(null)

    try {
      // Step 1: Get signed upload URL from our server
      const signedUrlResponse = await fetch('/api/admin/rulebook/signed-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameSlug }),
      })

      if (!signedUrlResponse.ok) {
        const data = await signedUrlResponse.json()
        throw new Error(data.error || 'Failed to get upload URL')
      }

      const { signedUrl, publicUrl } = await signedUrlResponse.json()

      // Step 2: Upload directly to Supabase Storage (bypasses our server)
      const uploadResponse = await fetch(signedUrl, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/pdf',
        },
        body: file,
      })

      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text()
        console.error('Direct upload failed:', errorText)
        throw new Error('Upload to storage failed')
      }

      // Step 3: Confirm upload and update game record
      const confirmResponse = await fetch('/api/admin/rulebook/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gameId, publicUrl }),
      })

      if (!confirmResponse.ok) {
        const data = await confirmResponse.json()
        throw new Error(data.error || 'Failed to confirm upload')
      }

      onRulebookSet(publicUrl)

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Rulebook Discovery</CardTitle>
          </div>
          {currentRulebookUrl && (
            <Badge variant="secondary" className="gap-1">
              <CheckCircle2 className="h-3 w-3" />
              Has Rulebook
            </Badge>
          )}
        </div>
        <CardDescription>
          Find the official rulebook PDF using multiple data sources
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current rulebook */}
        {currentRulebookUrl && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-1">Current Rulebook</div>
            <a
              href={currentRulebookUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-green-700 hover:underline flex items-center gap-1"
            >
              {currentRulebookUrl.length > 60
                ? `${currentRulebookUrl.slice(0, 60)}...`
                : currentRulebookUrl}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )}

        {/* Manual URL input - always visible */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Paste Rulebook URL:</div>
          <div className="flex gap-2">
            <Input
              placeholder="https://example.com/rulebook.pdf"
              value={manualUrl}
              onChange={(e) => setManualUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && manualUrl.trim() && handleManualSubmit()}
              className="flex-1"
            />
            <Button
              variant="outline"
              onClick={handleManualSubmit}
              disabled={!manualUrl.trim() || isSetting}
            >
              {isSetting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Set URL'}
            </Button>
          </div>
        </div>

        {/* File upload */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Or upload a PDF:</div>
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id={`rulebook-upload-${gameId}`}
            />
            <Button
              variant="outline"
              className="w-full gap-2"
              disabled={isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Upload PDF File
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">Max file size: 50MB</p>
        </div>

        {/* Google search button */}
        <div className="pt-2 border-t">
          <Button
            variant="outline"
            className="w-full gap-2"
            onClick={() => {
              const query = `"${gameName}" official rulebook PDF`
              window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank')
            }}
          >
            <Search className="h-4 w-4" />
            Search Google for Rulebook
          </Button>
        </div>

        {/* Error display */}
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 dark:bg-red-950/30 dark:border-red-800">
            <AlertCircle className="h-4 w-4 text-red-500 dark:text-red-400" />
            <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
