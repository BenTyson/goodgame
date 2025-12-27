'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Dices } from 'lucide-react'

import { Card, CardContent } from '@/components/ui/card'
import { getInitials, getInitialsColor } from './utils'
import type { PublisherWithGameCount } from '@/lib/supabase/queries'

interface PublisherCardProps {
  publisher: PublisherWithGameCount
}

export function PublisherCard({ publisher }: PublisherCardProps) {
  const initials = getInitials(publisher.name)
  const colorClass = getInitialsColor(publisher.name)

  return (
    <Link href={`/publishers/${publisher.slug}`}>
      <Card className="h-full transition-all duration-200 hover:shadow-lg hover:border-primary/30 group">
        <CardContent className="p-5">
          <div className="flex flex-col items-center text-center">
            {/* Logo or Initials - larger */}
            <div className="relative h-20 w-20 shrink-0 rounded-xl overflow-hidden mb-4 ring-1 ring-border/50 group-hover:ring-primary/30 transition-all">
              {publisher.logo_url ? (
                <Image
                  src={publisher.logo_url}
                  alt={publisher.name}
                  fill
                  className="object-contain p-1"
                  sizes="80px"
                />
              ) : (
                <div className={`flex h-full w-full items-center justify-center ${colorClass} text-white font-semibold text-2xl`}>
                  {initials}
                </div>
              )}
            </div>

            {/* Publisher Name */}
            <h2 className="font-semibold text-base leading-tight group-hover:text-primary transition-colors">
              {publisher.name}
            </h2>

            {/* Game Count */}
            <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
              <Dices className="h-3.5 w-3.5" />
              <span>{publisher.game_count} {publisher.game_count === 1 ? 'game' : 'games'}</span>
            </div>

            {/* Top Categories */}
            {publisher.top_categories && publisher.top_categories.length > 0 && (
              <div className="flex flex-wrap justify-center gap-1.5 mt-3">
                {publisher.top_categories.slice(0, 2).map((cat) => (
                  <span
                    key={cat.slug}
                    className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground"
                  >
                    {cat.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}
