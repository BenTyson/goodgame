'use client'

import Image from 'next/image'
import Link from 'next/link'
import {
  FileText,
  Image as ImageIcon,
  CheckCircle2,
  Clock,
  AlertCircle,
  Sparkles,
  Globe,
  Pencil,
  MoreHorizontal,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { VecnaGame, VecnaState } from '@/lib/vecna'
import { VECNA_STATE_CONFIG } from '@/lib/vecna'
import { QuickRulebookPopover } from './QuickRulebookPopover'

interface GameDiscoveryCardProps {
  game: VecnaGame
  requestCount?: number
  selected: boolean
  onSelect: (selected: boolean) => void
  onRulebookSet?: () => void
}

// State badge configuration - labels indicate what's NEEDED, not what's done
const STATE_BADGES: Record<VecnaState, { label: string; variant: 'default' | 'secondary' | 'outline' | 'destructive'; className?: string }> = {
  imported: { label: 'Needs Processing', variant: 'secondary' },
  enriched: { label: 'Needs Processing', variant: 'secondary' },
  rulebook_missing: { label: 'No Rulebook', variant: 'outline', className: 'border-amber-500 text-amber-600' },
  rulebook_ready: { label: 'Needs Parsing', variant: 'outline', className: 'border-blue-500 text-blue-600' },
  parsing: { label: 'Parsing...', variant: 'default', className: 'bg-blue-500' },
  parsed: { label: 'Needs Generation', variant: 'outline', className: 'border-violet-500 text-violet-600' },
  taxonomy_assigned: { label: 'Needs Generation', variant: 'outline', className: 'border-violet-500 text-violet-600' },
  generating: { label: 'Generating...', variant: 'default', className: 'bg-cyan-500' },
  generated: { label: 'Ready to Publish', variant: 'outline', className: 'border-green-500 text-green-600' },
  review_pending: { label: 'Needs Review', variant: 'outline', className: 'border-amber-500 text-amber-600' },
  published: { label: 'Published', variant: 'default', className: 'bg-green-600' },
}

export function GameDiscoveryCard({
  game,
  requestCount,
  selected,
  onSelect,
  onRulebookSet,
}: GameDiscoveryCardProps) {
  const stateBadge = STATE_BADGES[game.vecna_state]
  const isProcessing = game.vecna_state === 'parsing' || game.vecna_state === 'generating'
  const needsRulebook = !game.has_rulebook && !['published', 'generated', 'review_pending'].includes(game.vecna_state)

  return (
    <div
      className={cn(
        'group relative bg-card rounded-xl border p-3 transition-all duration-200',
        'hover:shadow-lg hover:-translate-y-0.5',
        selected && 'ring-2 ring-primary shadow-md',
        isProcessing && 'animate-pulse'
      )}
    >
      {/* Selection checkbox */}
      <div className="absolute top-2 left-2 z-10">
        <Checkbox
          checked={selected}
          onCheckedChange={onSelect}
          className={cn(
            'h-5 w-5 bg-background/80 backdrop-blur-sm border-2',
            selected && 'border-primary'
          )}
        />
      </div>

      {/* Request count badge */}
      {requestCount && requestCount > 0 && (
        <div className="absolute top-2 right-2 z-10">
          <Badge variant="default" className="bg-orange-500 text-white text-xs">
            {requestCount} req
          </Badge>
        </div>
      )}

      {/* Thumbnail container - relative for overlay positioning */}
      <div className="relative mb-3">
        {/* Image with overflow hidden for rounded corners */}
        <div className="relative aspect-[4/3] rounded-lg overflow-hidden bg-muted">
          {game.thumbnail_url || game.box_image_url ? (
            <Image
              src={game.thumbnail_url || game.box_image_url || ''}
              alt={game.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center">
              <ImageIcon className="h-8 w-8 text-muted-foreground/30" />
            </div>
          )}
        </div>

        {/* Hover overlay - outside overflow-hidden so buttons aren't clipped */}
        <div className="absolute inset-0 rounded-lg bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
          <Link href={`/admin/games/${game.id}`}>
            <Button size="sm" variant="secondary" className="h-8 gap-1.5">
              <Pencil className="h-3.5 w-3.5" />
              Edit
            </Button>
          </Link>
          <Link href={`/games/${game.slug}`} target="_blank">
            <Button size="sm" variant="secondary" className="h-8 gap-1.5">
              <Globe className="h-3.5 w-3.5" />
              View
            </Button>
          </Link>
        </div>
      </div>

      {/* Game info */}
      <div className="space-y-2">
        <div>
          <h3 className="font-medium text-sm truncate" title={game.name}>
            {game.name}
          </h3>
          <p className="text-xs text-muted-foreground">
            {game.year_published || 'Year unknown'}
            {game.relation_type && (
              <span className="ml-1 capitalize">
                {' '}&middot; {game.relation_type.replace(/_/g, ' ').replace(/ of$/i, '')}
              </span>
            )}
          </p>
        </div>

        {/* Badges row */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Badge
            variant={stateBadge.variant}
            className={cn('text-xs py-0 h-5', stateBadge.className)}
            title={game.vecna_error || undefined}
          >
            {stateBadge.label}
          </Badge>

          {/* Error indicator */}
          {game.vecna_error && (
            <span className="text-amber-500" title={game.vecna_error}>
              <AlertCircle className="h-4 w-4" />
            </span>
          )}

          {/* Rulebook button */}
          <QuickRulebookPopover
            gameId={game.id}
            gameSlug={game.slug}
            gameName={game.name}
            hasRulebook={game.has_rulebook}
            onRulebookSet={onRulebookSet}
          >
            <Button
              variant={game.has_rulebook ? 'outline' : 'default'}
              size="sm"
              className={cn(
                'h-7 text-xs gap-1.5',
                game.has_rulebook
                  ? 'border-green-500 text-green-600 hover:bg-green-50 dark:border-green-600 dark:text-green-400 dark:hover:bg-green-950/50'
                  : 'bg-amber-500 hover:bg-amber-600 text-white'
              )}
            >
              <FileText className="h-3.5 w-3.5" />
              Rules
            </Button>
          </QuickRulebookPopover>
        </div>

      </div>
    </div>
  )
}
