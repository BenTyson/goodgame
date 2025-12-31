'use client'

import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

interface TempImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  sizes?: string
  aspectRatio?: 'square' | '4/3' | '16/9'
}

/**
 * TempImage displays a reference image with a "Temp" badge overlay.
 * Used in admin to show BGG reference images that need to be replaced
 * with properly licensed images.
 */
export function TempImage({
  src,
  alt,
  fill = true,
  className,
  sizes,
  aspectRatio = '4/3'
}: TempImageProps) {
  const aspectClasses = {
    'square': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    '16/9': 'aspect-[16/9]'
  }

  return (
    <div className={cn('relative', aspectClasses[aspectRatio], className)}>
      <Image
        src={src}
        alt={alt}
        fill={fill}
        className="object-cover"
        sizes={sizes}
        unoptimized // External BGG images
      />
      {/* Semi-transparent overlay to indicate temp status */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      {/* Temp badge in corner */}
      <Badge
        variant="destructive"
        className="absolute top-2 left-2 text-[10px] font-bold uppercase tracking-wider shadow-lg"
      >
        Temp
      </Badge>
    </div>
  )
}
