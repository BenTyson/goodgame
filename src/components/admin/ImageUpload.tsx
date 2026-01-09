'use client'

import { useState, useCallback } from 'react'
import { createBrowserClient } from '@supabase/ssr'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Upload, X, Star, Loader2, ImageIcon, CloudUpload, AlertCircle, Pencil, Link2, Copyright, FileCheck, Crop, RefreshCw } from 'lucide-react'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type { Database } from '@/types/supabase'
import type { GameImage } from '@/types/database'
import { cn } from '@/lib/utils'

import { ImageCropper, type ImageAttribution, type ImageSource } from './ImageCropper'
import { readFileAsDataURL, type ImageType } from '@/lib/utils/image-crop'

const SOURCE_OPTIONS: { value: ImageSource; label: string }[] = [
  { value: 'publisher', label: 'Publisher Website' },
  { value: 'press_kit', label: 'Press Kit / Media Kit' },
  { value: 'promotional', label: 'Promotional Material' },
  { value: 'wikimedia', label: 'Wikimedia Commons' },
  { value: 'user_upload', label: 'Personal Photo' },
  { value: 'bgg', label: 'BoardGameGeek (dev only)' },
]

const LICENSE_OPTIONS = [
  { value: 'fair_use', label: 'Fair Use (editorial)' },
  { value: 'with_permission', label: 'Used with Permission' },
  { value: 'cc_by_sa_4', label: 'CC BY-SA 4.0' },
  { value: 'cc_by_4', label: 'CC BY 4.0' },
  { value: 'cc0', label: 'CC0 (Public Domain)' },
  { value: 'proprietary', label: 'Proprietary' },
]

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

  // Re-crop state (for existing images)
  const [recropImage, setRecropImage] = useState<GameImage | null>(null)

  // Edit modal state
  const [editingImage, setEditingImage] = useState<GameImage | null>(null)

  // Delete confirmation state
  const [deletingImage, setDeletingImage] = useState<GameImage | null>(null)
  const [deleting, setDeleting] = useState(false)

  const [editSource, setEditSource] = useState<ImageSource | ''>('')
  const [editSourceUrl, setEditSourceUrl] = useState('')
  const [editAttribution, setEditAttribution] = useState('')
  const [editLicense, setEditLicense] = useState('')
  const [saving, setSaving] = useState(false)

  const supabase = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  const uploadFile = async (file: File | Blob, imageType: ImageType, fileName?: string, attribution?: ImageAttribution): Promise<GameImage | null> => {
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

    // Add attribution data if provided
    if (attribution) {
      if (attribution.source) formData.append('source', attribution.source)
      if (attribution.source_url) formData.append('source_url', attribution.source_url)
      if (attribution.attribution) formData.append('attribution', attribution.attribution)
      if (attribution.license) formData.append('license', attribution.license)
    }

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

  const handleCropComplete = async (blob: Blob, attribution: ImageAttribution) => {
    setUploading(true)
    setError(null)

    try {
      if (recropImage) {
        // Re-cropping an existing image - replace it
        const oldImage = recropImage
        const imageType = (oldImage.image_type as ImageType) || 'gallery'

        // Preserve existing attribution if not provided in the modal
        const mergedAttribution: ImageAttribution = {
          source: attribution.source || (oldImage as unknown as ImageAttribution).source,
          source_url: attribution.source_url || (oldImage as unknown as ImageAttribution).source_url,
          attribution: attribution.attribution || (oldImage as unknown as ImageAttribution).attribution,
          license: attribution.license || (oldImage as unknown as ImageAttribution).license,
        }

        // Upload the new cropped image
        const newImage = await uploadFile(blob, imageType, pendingFileName, mergedAttribution)

        if (newImage) {
          // If the old image was primary, make the new one primary too
          if (oldImage.is_primary) {
            await supabase
              .from('game_images')
              .update({ is_primary: true })
              .eq('id', newImage.id)
            newImage.is_primary = true
          }

          // Delete the old image
          await fetch('/api/admin/upload', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              imageId: oldImage.id,
              storagePath: oldImage.storage_path
            })
          })

          // Update local state - replace old with new
          const updated = images.map(img =>
            img.id === oldImage.id ? newImage : img
          )
          onImagesChange(updated)
        }

        setRecropImage(null)
      } else {
        // New image upload
        const image = await uploadFile(blob, selectedImageType, pendingFileName, attribution)
        if (image) {
          onImagesChange([...images, image])
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed')
    }

    setUploading(false)
    setPendingImage(null)
    setPendingFileName('')
  }

  const openRecropModal = (image: GameImage) => {
    setRecropImage(image)
    setPendingImage(image.url)
    setPendingFileName(`recrop-${image.id}`)
    setSelectedImageType((image.image_type as ImageType) || 'gallery')
    setCropModalOpen(true)
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

  // Force sync the primary image to the games table (for when they're out of sync)
  const syncPrimaryImage = async (image: GameImage) => {
    setError(null)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          imageId: image.id,
          imageUrl: image.url
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to sync image')
      }

      // Verify by fetching the game directly
      const verifyResponse = await fetch(`/api/admin/games/${gameId}/verify-image`)
      const verifyData = await verifyResponse.json()

      console.log('Sync response:', data)
      console.log('Verification:', verifyData)

      alert(`Primary image synced!\n\nSent URL: ${image.url}\n\nDatabase now has:\nbox_image_url: ${verifyData.box_image_url || 'null'}\n\nMatch: ${verifyData.box_image_url === image.url ? 'YES' : 'NO - MISMATCH!'}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync image')
    }
  }

  const confirmDelete = async () => {
    if (!deletingImage) return

    setDeleting(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageId: deletingImage.id,
          storagePath: deletingImage.storage_path
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Delete failed')
      }

      // Update local state
      const remaining = images.filter(img => img.id !== deletingImage.id)

      // If deleted image was primary and there are remaining images, make first one primary
      if (deletingImage.is_primary && remaining.length > 0) {
        remaining[0].is_primary = true
        await supabase
          .from('game_images')
          .update({ is_primary: true })
          .eq('id', remaining[0].id)
      }

      onImagesChange(remaining)
      setDeletingImage(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed')
    } finally {
      setDeleting(false)
    }
  }

  const openEditModal = (image: GameImage) => {
    setEditingImage(image)
    // Type-safe access to the new fields (they may not be on the GameImage type yet)
    const imgAny = image as GameImage & { source?: string; source_url?: string; attribution?: string; license?: string }
    setEditSource((imgAny.source as ImageSource) || '')
    setEditSourceUrl(imgAny.source_url || '')
    setEditAttribution(imgAny.attribution || '')
    setEditLicense(imgAny.license || '')
  }

  const closeEditModal = () => {
    setEditingImage(null)
    setEditSource('')
    setEditSourceUrl('')
    setEditAttribution('')
    setEditLicense('')
  }

  const saveImageMetadata = async () => {
    if (!editingImage) return

    setSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_metadata',
          imageId: editingImage.id,
          source: editSource || null,
          source_url: editSourceUrl || null,
          attribution: editAttribution || null,
          license: editLicense || null,
        })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save')
      }

      // Update local state
      const updated = images.map(img =>
        img.id === editingImage.id
          ? { ...img, source: editSource || null, source_url: editSourceUrl || null, attribution: editAttribution || null, license: editLicense || null } as GameImage
          : img
      )
      onImagesChange(updated)
      closeEditModal()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save')
    } finally {
      setSaving(false)
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
                  {image.is_primary ? (
                    <Button
                      type="button"
                      variant="secondary"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => syncPrimaryImage(image)}
                      title="Sync to game card"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  ) : (
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
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openRecropModal(image)}
                    title="Re-crop image"
                  >
                    <Crop className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => openEditModal(image)}
                    title="Edit attribution"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setDeletingImage(image)}
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
              setRecropImage(null)
            }
          }}
          imageType={selectedImageType}
          onCropComplete={handleCropComplete}
          fileName={pendingFileName}
        />
      )}

      {/* Edit Image Metadata Modal */}
      <Dialog open={!!editingImage} onOpenChange={(open) => !open && closeEditModal()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Pencil className="h-5 w-5" />
              Edit Image Attribution
            </DialogTitle>
            <DialogDescription>
              Update the source and licensing information for this image.
            </DialogDescription>
          </DialogHeader>

          {editingImage && (
            <div className="space-y-4">
              {/* Preview */}
              <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
                <img
                  src={editingImage.url}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Source Type */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <FileCheck className="h-4 w-4" />
                  Source Type
                </Label>
                <Select value={editSource} onValueChange={(v) => setEditSource(v as ImageSource)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Where is this image from?" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Source URL */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Link2 className="h-4 w-4" />
                  Source URL
                </Label>
                <Input
                  placeholder="https://publisher.com/game-page"
                  value={editSourceUrl}
                  onChange={(e) => setEditSourceUrl(e.target.value)}
                />
              </div>

              {/* Attribution Text */}
              <div className="space-y-2">
                <Label className="text-sm font-medium flex items-center gap-2">
                  <Copyright className="h-4 w-4" />
                  Attribution Text
                </Label>
                <Input
                  placeholder="© Capstone Games"
                  value={editAttribution}
                  onChange={(e) => setEditAttribution(e.target.value)}
                />
              </div>

              {/* License */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">License</Label>
                <Select value={editLicense} onValueChange={setEditLicense}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select license type" />
                  </SelectTrigger>
                  <SelectContent>
                    {LICENSE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={closeEditModal} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={saveImageMetadata} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={!!deletingImage} onOpenChange={(open) => !open && setDeletingImage(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertCircle className="h-5 w-5" />
              Delete Image
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this image? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          {deletingImage && (
            <div className="relative aspect-video w-full overflow-hidden rounded-lg bg-muted">
              <img
                src={deletingImage.url}
                alt="Image to delete"
                className="w-full h-full object-cover"
              />
              {deletingImage.is_primary && (
                <div className="absolute top-2 left-2 flex items-center gap-1 bg-amber-500 text-white text-xs px-2 py-1 rounded">
                  <Star className="h-3 w-3 fill-current" />
                  Primary
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => setDeletingImage(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
