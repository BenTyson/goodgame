'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

// AdSense configuration - set via environment variable
const ADSENSE_CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID

interface AdUnitProps {
  slot: string
  format?: 'auto' | 'rectangle' | 'horizontal' | 'vertical'
  layout?: 'in-article' | 'in-feed' | 'display'
  className?: string
  responsive?: boolean
}

export function AdUnit({
  slot,
  format = 'auto',
  layout = 'display',
  className,
  responsive = true,
}: AdUnitProps) {
  const adRef = useRef<HTMLModElement>(null)
  const isLoaded = useRef(false)

  useEffect(() => {
    // Don't load ads in development or if no client ID
    if (process.env.NODE_ENV === 'development' || !ADSENSE_CLIENT_ID) {
      return
    }

    // Prevent double-loading
    if (isLoaded.current) {
      return
    }

    try {
      // Push the ad to AdSense
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adsbygoogle = (window as any).adsbygoogle || []
      adsbygoogle.push({})
      isLoaded.current = true
    } catch (error) {
      console.error('AdSense error:', error)
    }
  }, [])

  // Show placeholder in development
  if (process.env.NODE_ENV === 'development' || !ADSENSE_CLIENT_ID) {
    return (
      <div
        className={cn(
          'flex items-center justify-center bg-muted/50 border border-dashed rounded-lg text-muted-foreground text-sm',
          format === 'rectangle' && 'w-[300px] h-[250px]',
          format === 'horizontal' && 'w-full h-[90px]',
          format === 'vertical' && 'w-[160px] h-[600px]',
          format === 'auto' && 'w-full min-h-[100px]',
          className
        )}
      >
        <span>Ad Placeholder ({format})</span>
      </div>
    )
  }

  return (
    <ins
      ref={adRef}
      className={cn('adsbygoogle block', className)}
      style={{ display: 'block' }}
      data-ad-client={ADSENSE_CLIENT_ID}
      data-ad-slot={slot}
      data-ad-format={responsive ? 'auto' : format}
      data-ad-layout={layout !== 'display' ? layout : undefined}
      data-full-width-responsive={responsive ? 'true' : undefined}
    />
  )
}

// Pre-configured ad units for common placements
export function LeaderboardAd({ className }: { className?: string }) {
  return (
    <AdUnit
      slot="LEADERBOARD_SLOT_ID"
      format="horizontal"
      className={cn('hidden md:block', className)}
    />
  )
}

export function SidebarAd({ className }: { className?: string }) {
  return (
    <AdUnit
      slot="SIDEBAR_SLOT_ID"
      format="rectangle"
      className={className}
    />
  )
}

export function InArticleAd({ className }: { className?: string }) {
  return (
    <AdUnit
      slot="IN_ARTICLE_SLOT_ID"
      layout="in-article"
      format="auto"
      className={className}
    />
  )
}

export function MobileAnchorAd({ className }: { className?: string }) {
  return (
    <AdUnit
      slot="MOBILE_ANCHOR_SLOT_ID"
      format="auto"
      className={cn('md:hidden', className)}
    />
  )
}
