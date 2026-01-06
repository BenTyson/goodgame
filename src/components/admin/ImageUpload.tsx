'use client'

import { useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Upload, X, Star, Loader2, ImageIcon, CloudUpload, AlertCircle } from 'lucide-react'
import type { Database } from '@/types/supabase'
import type { GameImage } from '@/types/database'
import { cn } from '@/lib/utils'

import { ImageCropper } from './ImageCropper'
import { readFileAsDataURL, type ImageType } from '@/lib/utils/image-crop'

interface ImageUploadProps {
  gameId: string
  gameSlug: string
  images: GameImage[]
  onImagesChange: (images: GameImage[]) => void
}

export function ImageUpload({ gameId, gameSlug, images, onImagesChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Cropper state
  const [pendingImage, setPendingImage] = useState<string | null>(null)
  const [pendingFileName, setPendingFileName] = useState<string>('')
  const [cropModalOpen, setCropModalOpen] = useState(false)
  const [selectedImageType, setSelectedImageType] = useState<ImageType>('cover')

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const uploadFile = async (file: File | Blob, imageType: ImageType, fileName?: string): Promise<GameImage | null> => {
    const formData = new FormData()

    // If it's a Blob (from cropper), convert to File with name
    if (file instanceof Blob && !(file instanceof File)) {
      const extension = file.type.split('/')[1] || 'jpg'
      const name = fileName || `cropped-image.${extension}`
      formData.append('file', file, name)
    } else {
      formData.append('file', file)
    }

    formData.append('gameId', gameId)
    formData.append('gameSlug', gameSlug)
    formData.append('imageType', imageType)

    const response = await fetch('/api/admin/upload', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const data = await response.json()
      throw new Error(data.error || 'Upload failed')
    }

    const data = await response.json()
    return data.image
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    // Take only the first file for cropping (multiple uploads come back through the modal)
    const file = files[0]
    e.target.value = '' // Reset input

    setError(null)

    try {
      const dataUrl = await readFileAsDataURL(file)
      setPendingImage(dataUrl)
      setPendingFileName(file.name)
      setCropModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
    }
  }

  const handleCropComplete = async (blob: Blob) => {
    setUploading(true)
    setError(null)

    try {
      const image = await uploadFile(blob, selectedImageType, pendingFileName)
      if (image) {
        onImagesChange([...images, image])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }

    setUploading(false)
    setPendingImage(null)
    setPendingFileName('')
  }

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files).filter(f =>
      f.type.startsWith('image/')
    )
    if (files.length === 0) return

    // Take only the first file for cropping
    const file = files[0]

    setError(null)

    try {
      const dataUrl = await readFileAsDataURL(file)
      setPendingImage(dataUrl)
      setPendingFileName(file.name)
      setCropModalOpen(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read file')
    }
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const setPrimaryImage = async (imageId: string) => {
    const selectedImage = images.find(img => img.id === imageId)
    if (!selectedImage) return

    setError(null)

    try {
      // Use API endpoint which has service role access
      const response = await fetch('/api/admin/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          imageId,
          imageUrl: selectedImage.url
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set primary image')
      }

      // Update local state
      const updated = images.map(img => ({
        ...img,
        is_primary: img.id === imageId
      }))
      onImagesChange(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary image')
    }
  }

  const deleteImage = async (image: GameImage) => {
    try {
      const response = await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: image.id,
          storagePath: image.storage_path
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Delete failed')
      }

      // Update local state
      const remaining = images.filter(img => img.id !== image.id)

      // If deleted image was primary and there are remaining images, make first one primary
      if (image.is_primary && remaining.length > 0) {
        remaining[0].is_primary = true
        await supabase
          .from('game_images')
          .update({ is_primary: true })
          .eq('id', remaining[0].id)
      }

      onImagesChange(remaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <div className="space-y-5">
      {/* Error message */}
      {error && (
        <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-700 dark:text-red-300 text-sm">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {/* Image Type Selector */}
      <div className="space-y-3">
        <Label className="text-xs text-muted-foreground uppercase tracking-wider">
          Image Type
        </Label>
        <RadioGroup
          value={selectedImageType}
          onValueChange={(value) => setSelectedImageType(value as ImageType)}
          className="grid grid-cols-3 gap-3"
        >
          <label
            htmlFor="type-cover"
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
              selectedImageType === 'cover'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
            )}
          >
            <RadioGroupItem value="cover" id="type-cover" className="sr-only" />
            <span className="text-sm font-medium">Cover</span>
            <span className="text-xs text-muted-foreground text-center">4:3 ratio</span>
          </label>
          <label
            htmlFor="type-hero"
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
              selectedImageType === 'hero'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
            )}
          >
            <RadioGroupItem value="hero" id="type-hero" className="sr-only" />
            <span className="text-sm font-medium">Hero</span>
            <span className="text-xs text-muted-foreground text-center">16:9 ratio</span>
          </label>
          <label
            htmlFor="type-gallery"
            className={cn(
              'flex flex-col items-center gap-2 p-3 rounded-lg border cursor-pointer transition-colors',
              selectedImageType === 'gallery'
                ? 'border-primary bg-primary/5 ring-1 ring-primary'
                : 'border-border hover:border-primary/50'
            )}
          >
            <RadioGroupItem value="gallery" id="type-gallery" className="sr-only" />
            <span className="text-sm font-medium">Gallery</span>
            <span className="text-xs text-muted-foreground text-center">Free crop</span>
          </label>
        </RadioGroup>
      </div>

      {/* Upload Zone */}
      <div
        className={cn(
          'relative border-2 border-dashed rounded-xl p-8 transition-all',
          dragOver
            ? 'border-primary bg-primary/5 scale-[1.02]'
            : 'border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
          disabled={uploading}
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-3">
            <div className={cn(
              'h-14 w-14 rounded-2xl flex items-center justify-center transition-colors',
              dragOver ? 'bg-primary/20' : 'bg-muted'
            )}>
              {uploading ? (
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
              ) : (
                <CloudUpload className={cn(
                  'h-6 w-6 transition-colors',
                  dragOver ? 'text-primary' : 'text-muted-foreground'
                )} />
              )}
            </div>
            <div className="text-center">
              <p className="font-medium">
                {uploading ? 'Uploading...' : 'Drop an image or click to upload'}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG, WebP, or GIF up to 5MB
              </p>
            </div>
          </div>
        </label>
      </div>

      {/* Image Gallery - All images in a unified grid */}
      {images.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <ImageIcon className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Gallery</span>
            <span className="text-xs text-muted-foreground">({images.length} image{images.length !== 1 ? 's' : ''})</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {images.map((image) => (
              <Card
                key={image.id}
                className={cn(
                  "relative overflow-hidden group aspect-[4/3]",
                  image.is_primary && "ring-2 ring-amber-500 ring-offset-2 ring-offset-background"
                )}
              >
                <img
                  src={image.url}
                  alt={image.is_primary ? "Primary" : "Gallery"}
                  className="w-full h-full object-cover"
                />
                {/* Primary badge */}
                {image.is_primary && (
                  <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                    <Star className="h-3 w-3 fill-current" />
                    Primary
                  </div>
                )}
                {/* Hover overlay with actions */}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {!image.is_primary && (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setPrimaryImage(image.id)}
                      title="Set as primary"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteImage(image)}
                    title="Delete"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            The primary image appears on game cards and as the hero image. Hover to change or delete.
          </p>
        </div>
      )}

      {/* Empty state */}
      {images.length === 0 && !uploading && (
        <div className="text-center py-6 text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p className="font-medium">No images yet</p>
          <p className="text-sm">Upload an image to get started</p>
        </div>
      )}

      {/* Image Cropper Modal */}
      {pendingImage && (
        <ImageCropper
          image={pendingImage}
          open={cropModalOpen}
          onOpenChange={(open) => {
            setCropModalOpen(open)
            if (!open) {
              setPendingImage(null)
              setPendingFileName('')
            }
          }}
          imageType={selectedImageType}
          onCropComplete={handleCropComplete}
          fileName={pendingFileName}
        />
      )}
    </div>
  )
}
