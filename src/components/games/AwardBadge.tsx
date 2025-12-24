import Link from 'next/link'
import { Trophy, Star, Award, Globe } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Award as AwardType, AwardCategory } from '@/types/database'

interface AwardBadgeProps {
  award: AwardType
  category?: AwardCategory | null
  year: number
  result?: string | null
  variant?: 'default' | 'compact' | 'inline'
  showYear?: boolean
  className?: string
}

// Icon mapping for awards
const awardIcons: Record<string, React.ReactNode> = {
  'spiel-des-jahres': <Trophy className="h-4 w-4" />,
  'kennerspiel-des-jahres': <Star className="h-4 w-4" />,
  'kinderspiel-des-jahres': <Award className="h-4 w-4" />,
  'golden-geek': <Star className="h-4 w-4" />,
  'dice-tower': <Award className="h-4 w-4" />,
  'as-dor': <Globe className="h-4 w-4" />,
}

// Award tier styling - dark bg with light text (badge style)
const awardTiers: Record<string, { bg: string; text: string; border: string }> = {
  // German awards - gold tier
  'spiel-des-jahres': {
    bg: 'bg-amber-600 dark:bg-amber-700',
    text: 'text-white dark:text-amber-100',
    border: 'border-amber-700 dark:border-amber-600',
  },
  'kennerspiel-des-jahres': {
    bg: 'bg-slate-600 dark:bg-slate-700',
    text: 'text-white dark:text-slate-100',
    border: 'border-slate-700 dark:border-slate-600',
  },
  'kinderspiel-des-jahres': {
    bg: 'bg-blue-600 dark:bg-blue-700',
    text: 'text-white dark:text-blue-100',
    border: 'border-blue-700 dark:border-blue-600',
  },
  // International awards
  'golden-geek': {
    bg: 'bg-purple-600 dark:bg-purple-700',
    text: 'text-white dark:text-purple-100',
    border: 'border-purple-700 dark:border-purple-600',
  },
  'dice-tower': {
    bg: 'bg-emerald-600 dark:bg-emerald-700',
    text: 'text-white dark:text-emerald-100',
    border: 'border-emerald-700 dark:border-emerald-600',
  },
  'as-dor': {
    bg: 'bg-rose-600 dark:bg-rose-700',
    text: 'text-white dark:text-rose-100',
    border: 'border-rose-700 dark:border-rose-600',
  },
}

const defaultTier = {
  bg: 'bg-primary/10',
  text: 'text-primary',
  border: 'border-primary/20',
}

export function AwardBadge({
  award,
  category,
  year,
  result = 'winner',
  variant = 'default',
  showYear = true,
  className,
}: AwardBadgeProps) {
  const icon = awardIcons[award.slug] || <Trophy className="h-4 w-4" />
  const tier = awardTiers[award.slug] || defaultTier

  if (variant === 'inline') {
    return (
      <Link
        href={`/awards/${award.slug}`}
        className={cn(
          'inline-flex items-center gap-1.5 text-sm hover:underline',
          tier.text,
          className
        )}
      >
        {icon}
        <span>
          {award.short_name || award.name}
          {showYear && ` ${year}`}
        </span>
      </Link>
    )
  }

  if (variant === 'compact') {
    return (
      <Link
        href={`/awards/${award.slug}`}
        className={cn(
          'inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium border transition-colors hover:opacity-80',
          tier.bg,
          tier.text,
          tier.border,
          className
        )}
      >
        {icon}
        <span>{award.short_name || award.name}</span>
        {showYear && <span className="opacity-70">{year}</span>}
      </Link>
    )
  }

  // Default variant
  return (
    <Link
      href={`/awards/${award.slug}`}
      className={cn(
        'flex items-start gap-3 rounded-lg border p-3 transition-all hover:shadow-sm',
        tier.bg,
        tier.border,
        className
      )}
    >
      <div className={cn('flex h-10 w-10 items-center justify-center rounded-lg', tier.bg)}>
        <span className={tier.text}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <div className={cn('font-semibold text-sm', tier.text)}>
          {award.short_name || award.name}
        </div>
        <div className="text-xs text-muted-foreground">
          {category?.name || (result === 'winner' ? 'Winner' : result)} &bull; {year}
        </div>
      </div>
    </Link>
  )
}

interface AwardBadgeListProps {
  awards: Array<{
    award: AwardType
    category: AwardCategory | null
    year: number
    result: string | null
  }>
  variant?: 'default' | 'compact' | 'inline'
  showYear?: boolean
  className?: string
  limit?: number
}

export function AwardBadgeList({
  awards,
  variant = 'compact',
  showYear = true,
  className,
  limit,
}: AwardBadgeListProps) {
  const displayAwards = limit ? awards.slice(0, limit) : awards

  if (displayAwards.length === 0) return null

  return (
    <div
      className={cn(
        'flex flex-wrap gap-2',
        variant === 'default' && 'flex-col',
        className
      )}
    >
      {displayAwards.map((item, idx) => (
        <AwardBadge
          key={`${item.award.slug}-${item.year}-${idx}`}
          award={item.award}
          category={item.category}
          year={item.year}
          result={item.result}
          variant={variant}
          showYear={showYear}
        />
      ))}
      {limit && awards.length > limit && (
        <span className="text-sm text-muted-foreground self-center">
          +{awards.length - limit} more
        </span>
      )}
    </div>
  )
}
