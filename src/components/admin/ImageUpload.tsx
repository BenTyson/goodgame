'use client'

import { useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Upload, X, Star, GripVertical, Loader2, ImageIcon } from 'lucide-react'
import type { Database } from '@/types/supabase'
import type { GameImage } from '@/types/database'

interface ImageUploadProps {
  gameId: string
  gameSlug: string
  images: GameImage[]
  onImagesChange: (images: GameImage[]) => void
}

export function ImageUpload({ gameId, gameSlug, images, onImagesChange }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const uploadFile = async (file: File): Promise<GameImage | null> => {
    const fileExt = file.name.split('.').pop()?.toLowerCase()
    const fileName = `${gameSlug}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`

    const { error: uploadError } = await supabase.storage
      .from('game-images')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return null
    }

    const { data: { publicUrl } } = supabase.storage
      .from('game-images')
      .getPublicUrl(fileName)

    // Create database record
    const newImage: Omit<GameImage, 'id' | 'created_at' | 'updated_at'> = {
      game_id: gameId,
      url: publicUrl,
      storage_path: fileName,
      image_type: 'gallery',
      is_primary: images.length === 0, // First image is primary by default
      display_order: images.length,
      alt_text: null,
      caption: null,
      width: null,
      height: null,
      file_size: file.size
    }

    const { data, error } = await supabase
      .from('game_images')
      .insert(newImage)
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      // Try to delete uploaded file
      await supabase.storage.from('game-images').remove([fileName])
      return null
    }

    return data
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    const newImages: GameImage[] = []

    for (const file of Array.from(files)) {
      const image = await uploadFile(file)
      if (image) {
        newImages.push(image)
      }
    }

    onImagesChange([...images, ...newImages])
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
    const newImages: GameImage[] = []

    for (const file of files) {
      const image = await uploadFile(file)
      if (image) {
        newImages.push(image)
      }
    }

    onImagesChange([...images, ...newImages])
    setUploading(false)
  }, [images, onImagesChange, gameId, gameSlug])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = () => {
    setDragOver(false)
  }

  const setPrimaryImage = async (imageId: string) => {
    // Update in database
    await supabase
      .from('game_images')
      .update({ is_primary: false })
      .eq('game_id', gameId)

    await supabase
      .from('game_images')
      .update({ is_primary: true })
      .eq('id', imageId)

    // Update local state
    const updated = images.map(img => ({
      ...img,
      is_primary: img.id === imageId
    }))
    onImagesChange(updated)
  }

  const deleteImage = async (image: GameImage) => {
    // Delete from storage
    if (image.storage_path) {
      await supabase.storage.from('game-images').remove([image.storage_path])
    }

    // Delete from database
    await supabase.from('game_images').delete().eq('id', image.id)

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
  }

  const primaryImage = images.find(img => img.is_primary)
  const secondaryImages = images.filter(img => !img.is_primary)

  return (
    <div className="space-y-6">
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
          multiple
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
              {uploading ? 'Uploading...' : 'Drop images here or click to upload'}
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
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPrimaryImage(image.id)}
                    title="Set as primary"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                  <Button
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
    </div>
  )
}
