'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

type ImageSource = 'bgg' | 'wikidata' | 'wikipedia' | 'uploaded'

interface SourcedImageProps {
  src: string
  alt: string
  source?: ImageSource
  fill?: boolean
  className?: string
  sizes?: string
  aspectRatio?: 'square' | '4/3' | '16/9'
}

const sourceConfig: Record<ImageSource, { label: string; variant: 'destructive' | 'secondary' | 'default'; className?: string }> = {
  bgg: { label: 'BGG', variant: 'destructive' },
  wikidata: { label: 'Wiki', variant: 'secondary', className: 'bg-blue-500 hover:bg-blue-500 text-white' },
  wikipedia: { label: 'Wikipedia', variant: 'secondary', className: 'bg-purple-500 hover:bg-purple-500 text-white' },
  uploaded: { label: 'Uploaded', variant: 'default', className: 'bg-green-500 hover:bg-green-500 text-white' },
}

/**
 * SourcedImage displays an image with a source badge overlay.
 * Used in admin to show image provenance:
 * - BGG: Reference image from BoardGameGeek (needs replacement)
 * - Wiki: CC-licensed image from Wikidata/Wikimedia Commons (safe for production)
 * - Uploaded: User-uploaded image to Supabase storage
 */
export function SourcedImage({
  src,
  alt,
  source = 'bgg',
  fill = true,
  className,
  sizes,
  aspectRatio = '4/3'
}: SourcedImageProps) {
  const aspectClasses = {
    'square': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-[16/9]'
  }

  const config = sourceConfig[source]
  const showOverlay = source === 'bgg' // Only dim BGG images

  return (
    <div className={cn('relative', aspectClasses[aspectRatio], className)}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className="object-cover"
        sizes={sizes}
        unoptimized // External images
      />
      {/* Semi-transparent overlay for BGG images to indicate temp status */}
      {showOverlay && (
        <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      )}
      {/* Source badge in corner */}
      <Badge
        variant={config.variant}
        className={cn(
          'absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider shadow-lg',
          config.className
        )}
      >
        {config.label}
      </Badge>
    </div>
  )
}

/** @deprecated Use SourcedImage instead */
export const TempImage = SourcedImage
