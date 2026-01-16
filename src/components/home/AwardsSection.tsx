import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, Trophy, Award, Star, Globe } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Award as AwardType } from '@/types/database'
import type { AwardWinner } from '@/lib/supabase/award-queries'

interface AwardsSectionProps {
  winners: (AwardWinner & { award: AwardType })[]
}

// Award slug to icon mapping
const AWARD_ICONS: Record<string, typeof Trophy> = {
  'spiel-des-jahres': Trophy,
  'kennerspiel-des-jahres': Award,
  'golden-geek': Star,
  'as-dor': Globe,
  'deutscher-spiele-preis': Trophy,
}

export function AwardsSection({ winners }: AwardsSectionProps) {
  if (winners.length === 0) return null

  return (
    <section className="container py-16 md:py-24">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Trophy className="h-5 w-5 text-amber-500" />
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Award Winners
            </h2>
          </div>
          <p className="text-muted-foreground text-lg">
            Critically acclaimed games from prestigious awards
          </p>
        </div>
        <Button variant="outline" asChild className="hidden sm:flex group">
          <Link href="/awards">
            All Awards
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {winners.map((winner, index) => (
          <AwardWinnerCard key={`${winner.award.id}-${winner.year}-${index}`} winner={winner} />
        ))}
      </div>

      <div className="mt-8 text-center sm:hidden">
        <Button variant="outline" asChild>
          <Link href="/awards">
            Explore All Awards
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  )
}

function AwardWinnerCard({ winner }: { winner: AwardWinner & { award: AwardType } }) {
  const Icon = AWARD_ICONS[winner.award.slug] || Trophy
  const game = winner.game

  if (!game) return null

  return (
    <Link href={`/games/${game.slug}`} className="group">
      <Card className="overflow-hidden transition-all duration-300 [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)] hover:-translate-y-1.5 hover:border-primary/30">
        <div className="flex">
          {/* Game image */}
          <div className="relative w-24 flex-shrink-0 bg-muted">
            {game.box_image_url ? (
              <Image
                src={game.box_image_url}
                alt={game.name}
                fill
                className="object-cover"
                sizes="96px"
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-gradient-to-br from-primary/20 to-accent/10">
                <span className="text-2xl font-bold text-primary/30">
                  {game.name.charAt(0)}
                </span>
              </div>
            )}
          </div>

          {/* Content */}
          <CardContent className="flex-1 p-4">
            <div className="flex items-start gap-2 mb-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-600">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-muted-foreground truncate">
                  {winner.award.short_name || winner.award.name}
                </p>
                <p className="text-xs text-muted-foreground">{winner.year}</p>
              </div>
            </div>

            <h3 className="font-semibold leading-tight line-clamp-2 group-hover:text-primary transition-colors">
              {game.name}
            </h3>

            {winner.category && (
              <Badge variant="secondary" className="mt-2 text-xs">
                {winner.category.name}
              </Badge>
            )}
          </CardContent>
        </div>
      </Card>
    </Link>
  )
}
