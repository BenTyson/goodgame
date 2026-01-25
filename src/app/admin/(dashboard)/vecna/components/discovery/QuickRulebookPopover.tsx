'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  FileText,
  Upload,
  Loader2,
  AlertCircle,
  Search,
  CheckCircle2,
  Trash2,
  ExternalLink,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

interface QuickRulebookPopoverProps {
  gameId: string
  gameSlug: string
  gameName: string
  hasRulebook: boolean
  rulebookUrl?: string | null
  onRulebookSet?: () => void
  children: React.ReactNode
}

export function QuickRulebookPopover({
  gameId,
  gameSlug,
  gameName,
  hasRulebook,
  rulebookUrl,
  onRulebookSet,
  children,
}: QuickRulebookPopoverProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [url, setUrl] = useState('')
  const [isSetting, setIsSetting] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [isClearing, setIsClearing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Truncate URL for display
  const truncatedUrl = rulebookUrl
    ? rulebookUrl.length > 40
      ? rulebookUrl.substring(0, 37) + '...'
      : rulebookUrl
    : null

  const handleClearRulebook = async () => {
    setIsClearing(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/vecna/${gameId}/discover-rulebook`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: null, source: 'manual' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to clear rulebook')
      }

      setOpen(false)
      onRulebookSet?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear rulebook')
    } finally {
      setIsClearing(false)
    }
  }

  const handleSetUrl = async () => {
    if (!url.trim()) return

    setIsSetting(true)
    setError(null)

    try {
      const response = await fetch(`/api/admin/vecna/${gameId}/discover-rulebook`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: url.trim(), source: 'manual' }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set URL')
      }

      setOpen(false)
      setUrl('')
      onRulebookSet?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set URL')
    } finally {
      setIsSetting(false)
    }
  }

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file')
      return
    }

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

      const { signedUrl, token, publicUrl } = await signedUrlResponse.json()

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

      setOpen(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onRulebookSet?.()
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setIsUploading(false)
    }
  }

  const handleGoogleSearch = () => {
    const query = `"${gameName}" official rulebook PDF`
    window.open(`https://www.google.com/search?q=${encodeURIComponent(query)}`, '_blank')
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            <span className="font-medium text-sm">
              {hasRulebook ? 'Change Rulebook' : 'Add Rulebook'}
            </span>
          </div>

          {/* Current rulebook status */}
          {hasRulebook && rulebookUrl && (
            <div className="p-2 bg-muted rounded-md space-y-2">
              <div className="text-xs text-muted-foreground">Current rulebook:</div>
              <div className="flex items-center gap-2">
                <a
                  href={rulebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline truncate flex-1"
                  title={rulebookUrl}
                >
                  {truncatedUrl}
                </a>
                <a
                  href={rulebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/50"
                onClick={handleClearRulebook}
                disabled={isClearing || isSetting || isUploading}
              >
                {isClearing ? (
                  <Loader2 className="h-3 w-3 animate-spin mr-1.5" />
                ) : (
                  <Trash2 className="h-3 w-3 mr-1.5" />
                )}
                Clear Rulebook
              </Button>
            </div>
          )}

          {hasRulebook && !rulebookUrl && (
            <div className="p-2 bg-amber-50 dark:bg-amber-950/30 rounded-md border border-amber-200 dark:border-amber-800">
              <div className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-400">
                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                <span>Rulebook URL is set but could not be loaded. Upload a new one or set a valid URL.</span>
              </div>
            </div>
          )}

          {/* URL input */}
          <div className="space-y-2">
            <Input
              placeholder="Paste URL here..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && url.trim() && handleSetUrl()}
              disabled={isSetting || isUploading}
            />
            <Button
              variant="default"
              size="sm"
              className="w-full"
              onClick={handleSetUrl}
              disabled={!url.trim() || isSetting || isUploading}
            >
              {isSetting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
              )}
              Set URL
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-popover px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Upload */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileUpload}
              className="hidden"
              id={`quick-upload-${gameId}`}
            />
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              disabled={isSetting || isUploading}
              onClick={() => fileInputRef.current?.click()}
            >
              {isUploading ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
              ) : (
                <Upload className="h-3.5 w-3.5 mr-1.5" />
              )}
              {isUploading ? 'Uploading...' : 'Upload PDF'}
            </Button>
          </div>

          {/* Google search */}
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-muted-foreground"
            onClick={handleGoogleSearch}
          >
            <Search className="h-3.5 w-3.5 mr-1.5" />
            Search Google
          </Button>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
