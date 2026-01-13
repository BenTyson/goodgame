'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ExternalLink, BookOpen, FileText, LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

// Placeholder content for when thumbnail is unavailable
function DocumentPlaceholder() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 bg-gradient-to-br from-muted to-muted/50">
      {/* Page lines decoration */}
      <div className="absolute inset-x-6 top-8 space-y-2 opacity-20">
        <div className="h-2 bg-foreground/30 rounded w-3/4" />
        <div className="h-2 bg-foreground/30 rounded w-full" />
        <div className="h-2 bg-foreground/30 rounded w-5/6" />
        <div className="h-2 bg-foreground/30 rounded w-full" />
        <div className="h-2 bg-foreground/30 rounded w-2/3" />
      </div>

      {/* Center icon */}
      <div className="relative z-10 flex flex-col items-center gap-3">
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
          <FileText className="h-12 w-12 text-primary" />
        </div>
        <span className="text-sm font-medium text-muted-foreground">PDF Document</span>
      </div>
    </div>
  )
}

export interface DocumentPreviewProps {
  /** URL to the document */
  documentUrl: string
  /** URL to the thumbnail image */
  thumbnailUrl?: string | null
  /** Label shown at top of preview (e.g., "Official Rulebook", "Setup Guide") */
  label: string
  /** Text shown on hover (e.g., "View Rulebook", "View Guide") */
  hoverText: string
  /** Text for the main button (e.g., "Read the Official Rules", "View Setup Guide") */
  buttonText: string
  /** Optional description text below the preview */
  description?: string
  /** Game name for alt text */
  gameName?: string
  /** Icon to show next to label */
  icon?: LucideIcon
}

export function DocumentPreview({
  documentUrl,
  thumbnailUrl,
  label,
  hoverText,
  buttonText,
  description,
  gameName,
  icon: Icon = BookOpen,
}: DocumentPreviewProps) {
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)

  const showThumbnail = thumbnailUrl && !imageError

  return (
    <Card className="overflow-hidden p-0">
      {/* Full-bleed thumbnail/placeholder as header */}
      <a
        href={documentUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative overflow-hidden group aspect-[8.5/11]"
      >
        {showThumbnail ? (
          <>
            {/* Loading skeleton */}
            {!imageLoaded && (
              <Skeleton className="absolute inset-0 rounded-none" />
            )}
            {/* Actual thumbnail */}
            <Image
              src={thumbnailUrl}
              alt={`${gameName || 'Game'} ${label.toLowerCase()} preview`}
              fill
              className={cn(
                "object-cover transition-opacity duration-300",
                imageLoaded ? "opacity-100" : "opacity-0"
              )}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              sizes="(max-width: 768px) 100vw, 300px"
            />
          </>
        ) : (
          <DocumentPlaceholder />
        )}

        {/* Top label overlay */}
        <div className="absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/60 to-transparent pt-3 pb-6 px-4">
          <span className="text-white text-sm font-medium tracking-wide flex items-center gap-2">
            <Icon className="h-4 w-4" />
            {label}
          </span>
        </div>

        {/* Hover overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity z-10">
          <span className="text-white text-sm font-medium flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/20 backdrop-blur">
            {hoverText}
            <ExternalLink className="h-3.5 w-3.5" />
          </span>
        </div>
      </a>

      <CardContent className="p-4">
        {description && (
          <p className="text-sm text-muted-foreground text-center mb-4">
            {description}
          </p>
        )}
        <Button className="w-full gap-2" asChild>
          <a
            href={documentUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon className="h-4 w-4" />
            {buttonText}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      </CardContent>
    </Card>
  )
}
