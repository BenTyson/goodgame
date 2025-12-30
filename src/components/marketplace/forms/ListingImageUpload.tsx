'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Star, Loader2, ImageIcon, AlertCircle } from 'lucide-react'
import type { ListingImage } from '@/types/marketplace'

interface ListingImageUploadProps {
  listingId: string
  images: ListingImage[]
  onImagesChange: (images: ListingImage[]) => void
  maxImages?: number
  disabled?: boolean
}

export function ListingImageUpload({
  listingId,
  images,
  onImagesChange,
  maxImages = 6,
  disabled = false,
}: ListingImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const uploadFile = async (file: File): Promise<ListingImage | null> => {
    const formData = new FormData()
    formData.append('file', file)

    const response = await fetch(`/api/marketplace/listings/${listingId}/images`, {
      method: 'POST',
      body: formData,
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

    // Check limit
    const remainingSlots = maxImages - images.length
    if (remainingSlots <= 0) {
      setError(`Maximum ${maxImages} images allowed`)
      return
    }

    const filesToUpload = Array.from(files).slice(0, remainingSlots)

    setUploading(true)
    setError(null)
    const newImages: ListingImage[] = []

    try {
      for (const file of filesToUpload) {
        const image = await uploadFile(file)
        if (image) {
          newImages.push(image)
        }
      }

      onImagesChange([...images, ...newImages])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }

    setUploading(false)
    e.target.value = '' // Reset input
  }

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault()
      setDragOver(false)

      if (disabled) return

      const files = Array.from(e.dataTransfer.files).filter((f) =>
        f.type.startsWith('image/')
      )
      if (files.length === 0) return

      // Check limit
      const remainingSlots = maxImages - images.length
      if (remainingSlots <= 0) {
        setError(`Maximum ${maxImages} images allowed`)
        return
      }

      const filesToUpload = files.slice(0, remainingSlots)

      setUploading(true)
      setError(null)
      const newImages: ListingImage[] = []

      try {
        for (const file of filesToUpload) {
          const image = await uploadFile(file)
          if (image) {
            newImages.push(image)
          }
        }

        onImagesChange([...images, ...newImages])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed')
      }

      setUploading(false)
    },
    [images, onImagesChange, maxImages, disabled, listingId]
  )

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    if (!disabled) setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const setPrimaryImage = async (imageId: string) => {
    setError(null)

    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageId, setPrimary: true }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to set primary image')
      }

      // Update local state
      const updated = images.map((img) => ({
        ...img,
        is_primary: img.id === imageId,
      }))
      onImagesChange(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set primary image')
    }
  }

  const deleteImage = async (image: ListingImage) => {
    setError(null)

    try {
      const response = await fetch(`/api/marketplace/listings/${listingId}/images`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: image.id,
          storagePath: image.storage_path,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Delete failed')
      }

      // Update local state
      const remaining = images.filter((img) => img.id !== image.id)

      // If deleted image was primary and there are remaining images, first one becomes primary
      if (image.is_primary && remaining.length > 0) {
        remaining[0] = { ...remaining[0], is_primary: true }
      }

      onImagesChange(remaining)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const primaryImage = images.find((img) => img.is_primary)
  const secondaryImages = images.filter((img) => !img.is_primary)
  const canUploadMore = images.length < maxImages

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Upload Zone */}
      {canUploadMore && (
        <div
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            dragOver
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-muted-foreground/50'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
        >
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            multiple
            onChange={handleFileChange}
            className="hidden"
            id="listing-image-upload"
            disabled={uploading || disabled}
          />
          <label
            htmlFor="listing-image-upload"
            className={disabled ? 'cursor-not-allowed' : 'cursor-pointer'}
          >
            <div className="flex flex-col items-center gap-2">
              {uploading ? (
                <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
              ) : (
                <Upload className="h-10 w-10 text-muted-foreground" />
              )}
              <p className="text-sm font-medium">
                {uploading ? 'Uploading...' : 'Drop images here or click to upload'}
              </p>
              <p className="text-xs text-muted-foreground">
                JPG, PNG, WebP, or GIF up to 10MB ({images.length}/{maxImages} images)
              </p>
            </div>
          </label>
        </div>
      )}

      {/* Primary Image */}
      {primaryImage && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
            Primary Image
          </h3>
          <Card className="relative overflow-hidden">
            <img
              src={primaryImage.url}
              alt="Primary listing image"
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteImage(primaryImage)}
                disabled={disabled}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-sm font-medium">
                This image appears on listing cards and search results
              </p>
            </div>
          </Card>
        </div>
      )}

      {/* Secondary Images */}
      {secondaryImages.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <ImageIcon className="h-4 w-4" />
            Additional Images ({secondaryImages.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {secondaryImages.map((image) => (
              <Card key={image.id} className="relative overflow-hidden group">
                <img
                  src={image.url}
                  alt="Listing image"
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPrimaryImage(image.id)}
                    title="Set as primary"
                    disabled={disabled}
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => deleteImage(image)}
                    title="Delete"
                    disabled={disabled}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No images uploaded yet</p>
          <p className="text-sm">
            Photos of the actual game condition help buyers make decisions
          </p>
        </div>
      )}
    </div>
  )
}
