'use client'

import { ExternalLink, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// Amazon Associate tag - set via environment variable
const AMAZON_ASSOCIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || 'goodgame-20'

interface AffiliateButtonProps {
  provider: 'amazon' | 'miniature_market' | 'board_game_atlas' | 'custom'
  asin?: string // Amazon ASIN
  url?: string // Custom URL (for non-Amazon)
  label?: string
  gameSlug?: string // For tracking
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg'
  className?: string
  showIcon?: boolean
}

// Generate Amazon affiliate URL
function getAmazonUrl(asin: string): string {
  return `https://www.amazon.com/dp/${asin}?tag=${AMAZON_ASSOCIATE_TAG}`
}

// Provider configurations
const providerConfig = {
  amazon: {
    label: 'Buy on Amazon',
    icon: ShoppingCart,
    className: 'bg-[#FF9900] hover:bg-[#FF9900]/90 text-black',
  },
  miniature_market: {
    label: 'Miniature Market',
    icon: ExternalLink,
    className: 'bg-[#004B87] hover:bg-[#004B87]/90 text-white',
  },
  board_game_atlas: {
    label: 'Board Game Atlas',
    icon: ExternalLink,
    className: 'bg-[#5C4033] hover:bg-[#5C4033]/90 text-white',
  },
  custom: {
    label: 'Buy Now',
    icon: ExternalLink,
    className: '',
  },
}

export function AffiliateButton({
  provider,
  asin,
  url,
  label,
  gameSlug,
  variant = 'default',
  size = 'default',
  className,
  showIcon = true,
}: AffiliateButtonProps) {
  const config = providerConfig[provider]
  const Icon = config.icon

  // Determine the final URL
  let href: string
  if (provider === 'amazon' && asin) {
    href = getAmazonUrl(asin)
  } else if (url) {
    href = url
  } else {
    // No valid URL
    return null
  }

  // Track click (could be enhanced with analytics)
  const handleClick = () => {
    // Log affiliate click for analytics
    if (typeof window !== 'undefined' && gameSlug) {
      // Could send to analytics service
      console.log(`Affiliate click: ${provider} for ${gameSlug}`)
    }
  }

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn(
        variant === 'default' && config.className,
        className
      )}
      onClick={handleClick}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        {showIcon && <Icon className="mr-2 h-4 w-4" />}
        {label || config.label}
      </a>
    </Button>
  )
}

// Convenience component for Amazon buttons
interface AmazonButtonProps {
  asin: string
  label?: string
  gameSlug?: string
  size?: 'default' | 'sm' | 'lg'
  className?: string
}

export function AmazonButton({
  asin,
  label = 'Buy on Amazon',
  gameSlug,
  size = 'default',
  className,
}: AmazonButtonProps) {
  return (
    <AffiliateButton
      provider="amazon"
      asin={asin}
      label={label}
      gameSlug={gameSlug}
      size={size}
      className={className}
    />
  )
}

// Buy buttons group for game pages
interface BuyButtonsProps {
  amazonAsin?: string | null
  affiliateLinks?: {
    provider: string
    url: string
    label?: string | null
    is_primary?: boolean | null
  }[]
  gameSlug: string
  className?: string
}

export function BuyButtons({
  amazonAsin,
  affiliateLinks = [],
  gameSlug,
  className,
}: BuyButtonsProps) {
  const hasAmazon = !!amazonAsin
  const hasOtherLinks = affiliateLinks.length > 0

  if (!hasAmazon && !hasOtherLinks) {
    return null
  }

  return (
    <div className={cn('flex flex-wrap gap-3', className)}>
      {/* Amazon is always primary if ASIN exists */}
      {hasAmazon && (
        <AmazonButton
          asin={amazonAsin}
          gameSlug={gameSlug}
          size="lg"
        />
      )}

      {/* Other affiliate links */}
      {affiliateLinks.map((link, index) => (
        <AffiliateButton
          key={index}
          provider={link.provider as 'miniature_market' | 'board_game_atlas' | 'custom'}
          url={link.url}
          label={link.label || undefined}
          gameSlug={gameSlug}
          variant={hasAmazon ? 'outline' : 'default'}
          size="lg"
        />
      ))}
    </div>
  )
}
