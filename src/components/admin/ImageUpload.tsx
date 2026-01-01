'use client'

import { useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Upload, X, Star, Loader2, ImageIcon } from 'lucide-react'
import type { Database } from '@/types/supabase'
import type { GameImage } from '@/types/database'

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

  const primaryImage = images.find(img => img.is_primary)
  const secondaryImages = images.filter(img => !img.is_primary)

  return (
    <div className="space-y-6">
      {/* Error message */}
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
          {error}
        </div>
      )}

      {/* Image Type Selector */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Image Type</Label>
        <RadioGroup
          value={selectedImageType}
          onValueChange={(value) => setSelectedImageType(value as ImageType)}
          className="flex gap-6"
        >
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="cover" id="type-cover" />
            <Label htmlFor="type-cover" className="cursor-pointer text-sm">
              Cover (4:3)
              <span className="block text-xs text-muted-foreground">Game cards & thumbnails</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="hero" id="type-hero" />
            <Label htmlFor="type-hero" className="cursor-pointer text-sm">
              Hero (16:9)
              <span className="block text-xs text-muted-foreground">Banner images</span>
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <RadioGroupItem value="gallery" id="type-gallery" />
            <Label htmlFor="type-gallery" className="cursor-pointer text-sm">
              Gallery
              <span className="block text-xs text-muted-foreground">Any aspect ratio</span>
            </Label>
          </div>
        </RadioGroup>
      </div>

      {/* Upload Zone */}
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
          accept="image/jpeg,image/png,image/webp,image/gif"
          onChange={handleFileChange}
          className="hidden"
          id="image-upload"
          disabled={uploading}
        />
        <label htmlFor="image-upload" className="cursor-pointer">
          <div className="flex flex-col items-center gap-2">
            {uploading ? (
              <Loader2 className="h-10 w-10 text-muted-foreground animate-spin" />
            ) : (
              <Upload className="h-10 w-10 text-muted-foreground" />
            )}
            <p className="text-sm font-medium">
              {uploading ? 'Uploading...' : 'Drop an image here or click to upload'}
            </p>
            <p className="text-xs text-muted-foreground">
              JPG, PNG, WebP, or GIF up to 5MB
            </p>
          </div>
        </label>
      </div>

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
              alt="Primary"
              className="w-full h-64 object-cover"
            />
            <div className="absolute top-2 right-2 flex gap-1">
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="h-8 w-8"
                onClick={() => deleteImage(primaryImage)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3">
              <p className="text-white text-sm font-medium">
                This image appears on game cards and as the hero image
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
            Gallery Images ({secondaryImages.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {secondaryImages.map((image) => (
              <Card key={image.id} className="relative overflow-hidden group">
                <img
                  src={image.url}
                  alt="Gallery"
                  className="w-full h-32 object-cover"
                />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
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
        </div>
      )}

      {images.length === 0 && !uploading && (
        <div className="text-center py-8 text-muted-foreground">
          <ImageIcon className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No images uploaded yet</p>
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
