import Link from 'next/link'
import { Pencil, Palette, Building2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import type { Designer, Artist, Publisher } from '@/types/database'

interface CreditsSectionProps {
  designers?: Designer[] | null
  artists?: Artist[] | null
  publishers?: Publisher[] | null
  /** Display variant */
  variant?: 'default' | 'compact' | 'inline'
  /** Show role icons */
  showIcons?: boolean
  /** Maximum items to show per category before "+X more" */
  limit?: number
  className?: string
}

interface CreditRowProps {
  icon: React.ReactNode
  label: string
  items: Array<{ id: string; slug: string; name: string }>
  urlPrefix: string
  limit: number
  variant: 'default' | 'compact' | 'inline'
}

function CreditRow({ icon, label, items, urlPrefix, limit, variant }: CreditRowProps) {
  if (!items || items.length === 0) return null

  const displayItems = items.slice(0, limit)
  const remaining = items.length - limit

  if (variant === 'inline') {
    return (
      <div className="flex items-center gap-1.5 text-sm">
        <span className="text-muted-foreground shrink-0">{icon}</span>
        <span className="text-muted-foreground shrink-0">{label}:</span>
        <span className="flex flex-wrap gap-x-1">
          {displayItems.map((item, idx) => (
            <span key={item.id}>
              <Link
                href={`${urlPrefix}${item.slug}`}
                className="text-foreground hover:text-primary hover:underline transition-colors"
              >
                {item.name}
              </Link>
              {idx < displayItems.length - 1 && <span className="text-muted-foreground">,</span>}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-muted-foreground">+{remaining} more</span>
          )}
        </span>
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className="flex items-start gap-2">
        <span className="text-muted-foreground mt-0.5 shrink-0">{icon}</span>
        <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
          {displayItems.map((item, idx) => (
            <span key={item.id}>
              <Link
                href={`${urlPrefix}${item.slug}`}
                className="text-sm text-foreground hover:text-primary hover:underline transition-colors"
              >
                {item.name}
              </Link>
              {idx < displayItems.length - 1 && <span className="text-muted-foreground">,</span>}
            </span>
          ))}
          {remaining > 0 && (
            <span className="text-xs text-muted-foreground">+{remaining} more</span>
          )}
        </div>
      </div>
    )
  }

  // Default variant
  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {icon}
        <span>{label}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {displayItems.map((item) => (
          <Link
            key={item.id}
            href={`${urlPrefix}${item.slug}`}
            className="group flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-1.5 text-sm transition-colors hover:bg-muted"
          >
            <span className="font-medium">{item.name}</span>
          </Link>
        ))}
        {remaining > 0 && (
          <span className="flex items-center px-3 py-1.5 text-sm text-muted-foreground">
            +{remaining} more
          </span>
        )}
      </div>
    </div>
  )
}

export function CreditsSection({
  designers,
  artists,
  publishers,
  variant = 'default',
  showIcons = true,
  limit = 5,
  className
}: CreditsSectionProps) {
  const designerList = designers || []
  const artistList = artists || []
  const publisherList = publishers || []

  const hasDesigners = designerList.length > 0
  const hasArtists = artistList.length > 0
  const hasPublishers = publisherList.length > 0

  if (!hasDesigners && !hasArtists && !hasPublishers) return null

  const iconSize = variant === 'compact' ? 'h-3.5 w-3.5' : 'h-4 w-4'

  return (
    <div className={cn(
      'space-y-3',
      variant === 'inline' && 'space-y-1.5',
      variant === 'compact' && 'space-y-2',
      className
    )}>
      {hasDesigners && (
        <CreditRow
          icon={showIcons ? <Pencil className={iconSize} /> : null}
          label={designerList.length === 1 ? 'Designer' : 'Designers'}
          items={designerList}
          urlPrefix="/designers/"
          limit={limit}
          variant={variant}
        />
      )}
      {hasArtists && (
        <CreditRow
          icon={showIcons ? <Palette className={iconSize} /> : null}
          label={artistList.length === 1 ? 'Artist' : 'Artists'}
          items={artistList}
          urlPrefix="/artists/"
          limit={limit}
          variant={variant}
        />
      )}
      {hasPublishers && (
        <CreditRow
          icon={showIcons ? <Building2 className={iconSize} /> : null}
          label={publisherList.length === 1 ? 'Publisher' : 'Publishers'}
          items={publisherList}
          urlPrefix="/publishers/"
          limit={limit}
          variant={variant}
        />
      )}
    </div>
  )
}

// Simple inline credits for hero section
export function InlineCredits({
  designers = [],
  publishers = [],
  className
}: {
  designers?: Designer[]
  publishers?: Publisher[]
  className?: string
}) {
  const hasDesigners = designers.length > 0
  const hasPublishers = publishers.length > 0

  if (!hasDesigners && !hasPublishers) return null

  return (
    <div className={cn('flex flex-wrap items-center gap-x-4 gap-y-1 text-sm', className)}>
      {hasDesigners && (
        <div className="flex items-center gap-1.5">
          <Pencil className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex flex-wrap gap-x-1">
            {designers.slice(0, 3).map((d, idx) => (
              <span key={d.id}>
                <Link
                  href={`/designers/${d.slug}`}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {d.name}
                </Link>
                {idx < Math.min(designers.length, 3) - 1 && <span className="text-muted-foreground">,</span>}
              </span>
            ))}
            {designers.length > 3 && (
              <span className="text-muted-foreground">+{designers.length - 3}</span>
            )}
          </span>
        </div>
      )}
      {hasPublishers && (
        <div className="flex items-center gap-1.5">
          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="flex flex-wrap gap-x-1">
            {publishers.slice(0, 2).map((p, idx) => (
              <span key={p.id}>
                <Link
                  href={`/publishers/${p.slug}`}
                  className="hover:text-primary hover:underline transition-colors"
                >
                  {p.name}
                </Link>
                {idx < Math.min(publishers.length, 2) - 1 && <span className="text-muted-foreground">,</span>}
              </span>
            ))}
            {publishers.length > 2 && (
              <span className="text-muted-foreground">+{publishers.length - 2}</span>
            )}
          </span>
        </div>
      )}
    </div>
  )
}
