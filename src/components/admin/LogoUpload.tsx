'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Loader2, ImageIcon } from 'lucide-react'
import { getInitials, getInitialsColor } from '@/components/publishers/utils'

interface LogoUploadProps {
  publisherId: string
  publisherSlug: string
  currentLogoUrl: string | null
  onLogoChange: (logoUrl: string | null) => void
  publisherName?: string
}

export function LogoUpload({
  publisherId,
  publisherSlug,
  currentLogoUrl,
  onLogoChange,
  publisherName = 'Publisher'
}: LogoUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const initials = getInitials(publisherName)
  const colorClass = getInitialsColor(publisherName)

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('publisherId', publisherId)
    formData.append('publisherSlug', publisherSlug)

    const response = await fetch('/api/admin/publisher-logo', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Upload failed')
    }

    const data = await response.json()
    return data.url
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const url = await uploadFile(files[0])
      if (url) {
        onLogoChange(url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }

    setUploading(false)
    e.target.value = '' // Reset input
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/')
    )
    if (files.length === 0) return

    setUploading(true)
    setError(null)

    try {
      const url = await uploadFile(files[0])
      if (url) {
        onLogoChange(url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }

    setUploading(false)
  }, [publisherId, publisherSlug, onLogoChange])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const deleteLogo = async () => {
    setDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/publisher-logo', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ publisherId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Delete failed')
      }

      onLogoChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }

    setDeleting(false)
  }

  return (
    <div className="space-y-4">
      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {currentLogoUrl ? (
        // Current Logo Display
        <div className="space-y-4">
          <Card className="relative overflow-hidden p-4">
            <div className="flex items-start gap-4">
              <div className="relative h-24 w-24 rounded-lg overflow-hidden bg-muted shrink-0">
                <Image
                  src={currentLogoUrl}
                  alt="Publisher logo"
                  fill
                  className="object-contain"
                  sizes="96px"
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium">Current Logo</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This logo appears on the publisher page and game cards
                </p>
                <div className="flex gap-2 mt-3">
                  <label htmlFor="logo-replace" className="cursor-pointer">
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
                      onChange={handleFileChange}
                      className="hidden"
                      id="logo-replace"
                      disabled={uploading}
                    />
                    <Button variant="outline" size="sm" asChild disabled={uploading}>
                      <span className="gap-2">
                        {uploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        Replace
                      </span>
                    </Button>
                  </label>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={deleteLogo}
                    disabled={deleting}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    {deleting ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Remove
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        // Upload Zone
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
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
            accept="image/jpeg,image/png,image/webp,image/gif,image/svg+xml"
            onChange={handleFileChange}
            className="hidden"
            id="logo-upload"
            disabled={uploading}
          />
          <label htmlFor="logo-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-3">
              {/* Preview of initials */}
              <div className={`h-16 w-16 rounded-xl ${colorClass} flex items-center justify-center text-white font-bold text-xl`}>
                {initials}
              </div>
              {uploading ? (
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-8 w-8 text-muted-foreground" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : 'Drop a logo here or click to upload'}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  JPG, PNG, WebP, GIF, or SVG up to 5MB
                </p>
              </div>
            </div>
          </label>
        </div>
      )}

      {/* No logo state info */}
      {!currentLogoUrl && !uploading && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
          <ImageIcon className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Without a logo, colored initials will be displayed based on the publisher name
          </p>
        </div>
      )}
    </div>
  )
}
