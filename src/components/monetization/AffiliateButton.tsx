'use client'

import { ExternalLink, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Retailer, AffiliateLinkWithRetailer } from '@/types/database'

// Amazon Associate tag - set via environment variable
const AMAZON_ASSOCIATE_TAG = process.env.NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG || 'goodgame-20'

interface AffiliateButtonProps {
  // New: Retailer object from database
  retailer?: Retailer | null
  productId?: string | null

  // Legacy: Provider string support
  provider?: 'amazon' | 'miniature_market' | 'board_game_atlas' | 'custom' | string
  asin?: string // Amazon ASIN
  url?: string // Direct URL override

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

// Build URL from retailer pattern
function buildUrlFromPattern(
  pattern: string,
  productId: string,
  affiliateTag?: string | null
): string {
  return pattern
    .replace('{product_id}', productId)
    .replace('{asin}', productId)
    .replace('{affiliate_tag}', affiliateTag || '')
}

// Legacy provider configurations (for backward compatibility)
const legacyProviderConfig: Record<string, {
  label: string
  icon: typeof ShoppingCart
  className: string
}> = {
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
  'miniature-market': {
    label: 'Miniature Market',
    icon: ExternalLink,
    className: 'bg-[#004B87] hover:bg-[#004B87]/90 text-white',
  },
  board_game_atlas: {
    label: 'Board Game Atlas',
    icon: ExternalLink,
    className: 'bg-[#5C4033] hover:bg-[#5C4033]/90 text-white',
  },
  target: {
    label: 'Buy at Target',
    icon: ExternalLink,
    className: 'bg-[#CC0000] hover:bg-[#CC0000]/90 text-white',
  },
  walmart: {
    label: 'Buy at Walmart',
    icon: ExternalLink,
    className: 'bg-[#0071CE] hover:bg-[#0071CE]/90 text-white',
  },
  coolstuffinc: {
    label: 'CoolStuffInc',
    icon: ExternalLink,
    className: 'bg-[#0066CC] hover:bg-[#0066CC]/90 text-white',
  },
  gamenerdz: {
    label: 'GameNerdz',
    icon: ExternalLink,
    className: 'bg-[#7B1FA2] hover:bg-[#7B1FA2]/90 text-white',
  },
  'noble-knight': {
    label: 'Noble Knight',
    icon: ExternalLink,
    className: 'bg-[#8B4513] hover:bg-[#8B4513]/90 text-white',
  },
  boardlandia: {
    label: 'Boardlandia',
    icon: ExternalLink,
    className: 'bg-[#2E7D32] hover:bg-[#2E7D32]/90 text-white',
  },
  cardhaus: {
    label: 'Cardhaus',
    icon: ExternalLink,
    className: 'bg-[#1565C0] hover:bg-[#1565C0]/90 text-white',
  },
  custom: {
    label: 'Buy Now',
    icon: ExternalLink,
    className: '',
  },
}

// Generate button class from brand color
function getButtonClassFromColor(brandColor: string | null): string {
  if (!brandColor) return ''

  // Determine if color is dark or light for text contrast
  const hex = brandColor.replace('#', '')
  const r = parseInt(hex.substring(0, 2), 16)
  const g = parseInt(hex.substring(2, 4), 16)
  const b = parseInt(hex.substring(4, 6), 16)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255
  const textColor = luminance > 0.5 ? 'text-black' : 'text-white'

  return `${textColor}`
}

export function AffiliateButton({
  retailer,
  productId,
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
  // Determine configuration from retailer or legacy provider
  let buttonLabel: string
  let buttonClassName: string
  let brandColor: string | null = null
  const Icon = retailer ? ExternalLink : (legacyProviderConfig[provider || 'custom']?.icon || ExternalLink)

  if (retailer) {
    // New retailer-based configuration
    buttonLabel = label || `Buy at ${retailer.name}`
    brandColor = retailer.brand_color
    buttonClassName = getButtonClassFromColor(brandColor)
  } else {
    // Legacy provider-based configuration
    const config = legacyProviderConfig[provider || 'custom'] || legacyProviderConfig.custom
    buttonLabel = label || config.label
    buttonClassName = config.className
  }

  // Determine the final URL
  let href: string | null = null

  if (url) {
    // Direct URL override takes priority
    href = url
  } else if (retailer?.url_pattern && productId) {
    // Build URL from retailer pattern
    href = buildUrlFromPattern(retailer.url_pattern, productId, retailer.affiliate_tag)
  } else if (provider === 'amazon' && asin) {
    // Legacy Amazon handling
    href = getAmazonUrl(asin)
  }

  if (!href) {
    // No valid URL
    return null
  }

  // Track click - placeholder for future analytics integration
  const handleClick = () => {
    // Future: send to analytics service
  }

  // Build style for dynamic brand color
  const dynamicStyle = brandColor && variant === 'default'
    ? { backgroundColor: brandColor }
    : undefined

  return (
    <Button
      asChild
      variant={variant}
      size={size}
      className={cn(
        variant === 'default' && !brandColor && buttonClassName,
        variant === 'default' && brandColor && buttonClassName,
        className
      )}
      style={dynamicStyle}
      onClick={handleClick}
    >
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer sponsored"
      >
        {showIcon && <Icon className="mr-2 h-4 w-4" />}
        {buttonLabel}
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
  affiliateLinks?: AffiliateLinkWithRetailer[]
  gameSlug: string
  className?: string
}

export function BuyButtons({
  amazonAsin,
  affiliateLinks = [],
  gameSlug,
  className,
}: BuyButtonsProps) {
  // Filter out Amazon links if we have ASIN (avoid duplicates)
  const nonAmazonLinks = amazonAsin
    ? affiliateLinks.filter(link =>
        link.provider !== 'amazon' &&
        link.retailer?.slug !== 'amazon'
      )
    : affiliateLinks

  const hasAmazon = !!amazonAsin
  const hasOtherLinks = nonAmazonLinks.length > 0

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

      {/* Other affiliate links - prefer retailer object over legacy provider */}
      {nonAmazonLinks.map((link) => (
        <AffiliateButton
          key={link.id}
          retailer={link.retailer}
          productId={link.product_id}
          provider={link.provider}
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
