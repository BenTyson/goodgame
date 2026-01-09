'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Globe,
  Search,
  Loader2,
  Plus,
  Check,
  ExternalLink,
} from 'lucide-react'
import type { CommonsImage } from '@/lib/wikimedia-commons'

interface WikimediaCommonsSearchProps {
  gameName: string
  gameId: string
  images: { url: string }[]
  onImageImported: (image: unknown) => void
  importingImages: Set<string>
  importedImages: Set<string>
  onImportStart: (key: string) => void
  onImportEnd: (key: string, success: boolean) => void
}

export function WikimediaCommonsSearch({
  gameName,
  gameId,
  images,
  onImageImported,
  importingImages,
  importedImages,
  onImportStart,
  onImportEnd,
}: WikimediaCommonsSearchProps) {
  const [searchQuery, setSearchQuery] = useState(gameName)
  const [searchResults, setSearchResults] = useState<CommonsImage[]>([])
  const [searching, setSearching] = useState(false)
  const [searched, setSearched] = useState(false)
  const [searchUrl, setSearchUrl] = useState<string | null>(null)

  const isImageInGallery = (url: string) => {
    return images.some(img => img.url === url)
  }

  const searchCommons = async () => {
    if (!searchQuery.trim() || searching) return

    setSearching(true)
    setSearchResults([])
    setSearched(false)

    try {
      const response = await fetch(
        `/api/admin/commons/search?q=${encodeURIComponent(searchQuery)}&limit=12`
      )

      if (!response.ok) {
        throw new Error('Search failed')
      }

      const data = await response.json()
      setSearchResults(data.images || [])
      setSearchUrl(data.commonsSearchUrl || null)
      setSearched(true)
    } catch (error) {
      console.error('Commons search failed:', error)
      setSearchResults([])
    } finally {
      setSearching(false)
    }
  }

  const importImage = async (img: CommonsImage) => {
    const imageKey = `commons:${img.url}`
    if (importingImages.has(imageKey) || importedImages.has(imageKey)) return

    onImportStart(imageKey)

    try {
      const response = await fetch('/api/admin/upload', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gameId,
          url: img.url,
          source: 'commons',
          license: img.license,
          isPrimary: images.length === 0,
          imageType: 'cover',
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Import failed')
      }

      const { image } = await response.json()
      onImageImported(image)
      onImportEnd(imageKey, true)
    } catch (error) {
      console.error('Failed to import image:', error)
      onImportEnd(imageKey, false)
    }
  }

  return (
    <Card className="border-dashed border-green-500/30 bg-green-500/5">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-6 rounded bg-green-600 flex items-center justify-center">
            <Globe className="h-3 w-3 text-white" />
          </div>
          <div>
            <CardTitle className="text-sm">Search Wikimedia Commons</CardTitle>
            <CardDescription className="text-xs">
              Find CC-licensed images directly from Wikimedia Commons
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search form */}
        <div className="flex gap-2">
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for images..."
            className="flex-1"
            onKeyDown={(e) => e.key === 'Enter' && searchCommons()}
          />
          <Button
            onClick={searchCommons}
            disabled={searching || !searchQuery.trim()}
            size="sm"
          >
            {searching ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            <span className="ml-2">Search</span>
          </Button>
        </div>

        {/* Search results */}
        {searchResults.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">
                Found {searchResults.length} images
              </p>
              {searchUrl && (
                <a
                  href={searchUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-green-600 hover:underline flex items-center gap-1"
                >
                  View all on Commons
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {searchResults.map((img, i) => {
                const imageKey = `commons:${img.url}`
                const isImporting = importingImages.has(imageKey)
                const isImported = importedImages.has(imageKey) || isImageInGallery(img.url)

                return (
                  <div key={i} className="relative group">
                    <div className="aspect-[4/3] rounded-lg overflow-hidden border bg-muted">
                      <img
                        src={img.thumbUrl}
                        alt={img.description || img.filename}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {/* Commons badge */}
                    <span className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 rounded bg-green-600 text-white">
                      Commons
                    </span>
                    {/* License badge */}
                    <span className="absolute bottom-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-green-500/90 text-white">
                      {img.license || 'CC'}
                    </span>
                    {/* Primary indicator */}
                    {img.isPrimary && (
                      <span className="absolute top-2 right-2 text-[10px] px-1.5 py-0.5 rounded bg-yellow-500 text-white">
                        Best
                      </span>
                    )}
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      {isImported ? (
                        <span className="flex items-center gap-1 text-xs text-white bg-green-600 px-2 py-1 rounded">
                          <Check className="h-3 w-3" />
                          In Gallery
                        </span>
                      ) : (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => importImage(img)}
                          disabled={isImporting}
                          className="text-xs"
                        >
                          {isImporting ? (
                            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          ) : (
                            <Plus className="h-3 w-3 mr-1" />
                          )}
                          Add to Gallery
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* No results message */}
        {searched && searchResults.length === 0 && (
          <div className="text-center py-4 text-muted-foreground text-sm">
            No images found. Try a different search term.
            {searchUrl && (
              <a
                href={searchUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block mt-2 text-green-600 hover:underline text-xs"
              >
                Search manually on Commons
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
