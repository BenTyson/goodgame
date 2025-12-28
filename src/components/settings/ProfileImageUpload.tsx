'use client'

import { useState, useCallback } from 'react'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Upload, X, Loader2, ImageIcon, User } from 'lucide-react'

interface ProfileImageUploadProps {
  imageType: 'header' | 'avatar'
  currentUrl: string | null
  onImageChange: (url: string | null) => void
  aspectRatio?: string // e.g., 'aspect-[3/1]' for header, 'aspect-square' for avatar
  placeholder?: string
}

export function ProfileImageUpload({
  imageType,
  currentUrl,
  onImageChange,
  aspectRatio = imageType === 'header' ? 'aspect-[3/1]' : 'aspect-square',
  placeholder,
}: ProfileImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isHeader = imageType === 'header'
  const label = isHeader ? 'Header Image' : 'Avatar'

  const uploadFile = async (file: File): Promise<string | null> => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('imageType', imageType)

    const response = await fetch('/api/user/profile-image', {
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
        onImageChange(url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }

    setUploading(false)
    e.target.value = ''
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
        onImageChange(url)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }

    setUploading(false)
  }, [imageType, onImageChange])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const deleteImage = async () => {
    setDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/user/profile-image', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageType })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Delete failed')
      }

      onImageChange(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }

    setDeleting(false)
  }

  const inputId = `${imageType}-upload`

  return (
    <div className="space-y-3">
      <label className="text-sm font-medium">{label}</label>

      {error && (
        <div className="bg-destructive/10 text-destructive px-3 py-2 rounded-md text-sm">
          {error}
        </div>
      )}

      {currentUrl ? (
        <div className="space-y-3">
          <div className={`relative ${aspectRatio} w-full overflow-hidden rounded-lg bg-muted`}>
            <Image
              src={currentUrl}
              alt={label}
              fill
              className={isHeader ? 'object-cover' : 'object-cover'}
              sizes={isHeader ? '(max-width: 768px) 100vw, 600px' : '128px'}
            />
          </div>
          <div className="flex gap-2">
            <label htmlFor={inputId} className="cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="hidden"
                id={inputId}
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
              onClick={deleteImage}
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
      ) : (
        <div
          className={`border-2 border-dashed rounded-lg transition-colors ${
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
            accept="image/jpeg,image/png,image/webp,image/gif"
            onChange={handleFileChange}
            className="hidden"
            id={inputId}
            disabled={uploading}
          />
          <label htmlFor={inputId} className="cursor-pointer block">
            <div className={`flex flex-col items-center justify-center gap-2 py-8 ${isHeader ? 'py-12' : 'py-8'}`}>
              {uploading ? (
                <Loader2 className="h-8 w-8 text-muted-foreground animate-spin" />
              ) : isHeader ? (
                <ImageIcon className="h-8 w-8 text-muted-foreground" />
              ) : (
                <User className="h-8 w-8 text-muted-foreground" />
              )}
              <div className="text-center">
                <p className="text-sm font-medium">
                  {uploading ? 'Uploading...' : `Drop ${label.toLowerCase()} here or click to upload`}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {isHeader ? 'Recommended: 1200x400px' : 'Recommended: 400x400px'} - JPG, PNG, WebP, GIF up to 5MB
                </p>
              </div>
            </div>
          </label>
        </div>
      )}

      {!currentUrl && placeholder && (
        <p className="text-xs text-muted-foreground">{placeholder}</p>
      )}
    </div>
  )
}
