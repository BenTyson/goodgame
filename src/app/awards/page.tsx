import { Metadata } from 'next'
import Link from 'next/link'
import { Trophy, Award, Star, Globe } from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { getAwards, getAwardWinners } from '@/lib/supabase/queries'

export const metadata: Metadata = {
  title: 'Board Game Awards',
  description:
    'Browse prestigious board game awards including Spiel des Jahres, Kennerspiel des Jahres, Golden Geek, Dice Tower, and As d\'Or. Discover award-winning games.',
}

// Icon mapping for awards
const awardIcons: Record<string, React.ReactNode> = {
  'spiel-des-jahres': <Trophy className="h-8 w-8" />,
  'kennerspiel-des-jahres': <Star className="h-8 w-8" />,
  'kinderspiel-des-jahres': <Award className="h-8 w-8" />,
  'golden-geek': <Star className="h-8 w-8" />,
  'dice-tower': <Award className="h-8 w-8" />,
  'as-dor': <Globe className="h-8 w-8" />,
  'american-tabletop': <Trophy className="h-8 w-8" />,
  'origins-awards': <Award className="h-8 w-8" />,
  'mensa-select': <Star className="h-8 w-8" />,
  'deutscher-spiele-preis': <Trophy className="h-8 w-8" />,
  'international-gamers-award': <Globe className="h-8 w-8" />,
}

// Country flag emojis
const countryFlags: Record<string, string> = {
  'Germany': '🇩🇪',
  'USA': '🇺🇸',
  'France': '🇫🇷',
  'International': '🌍',
}

export default async function AwardsPage() {
  const awards = await getAwards()

  // Get winner counts for each award
  const awardsWithCounts = await Promise.all(
    awards.map(async (award) => {
      const winners = await getAwardWinners(award.slug)
      return {
        ...award,
        winnerCount: winners.length,
      }
    })
  )

  // Split into regions: American first, then German, then Other International
  const americanAwards = awardsWithCounts.filter(a => a.country === 'USA')
  const germanAwards = awardsWithCounts.filter(a => a.country === 'Germany')
  const otherAwards = awardsWithCounts.filter(a => a.country !== 'USA' && a.country !== 'Germany')

  return (
    <div className="container py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Trophy className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              Board Game Awards
            </h1>
            <p className="text-muted-foreground">
              Discover award-winning games
            </p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="mb-8 max-w-2xl">
        <p className="text-muted-foreground">
          Board game awards recognize excellence in game design. From the prestigious
          German Spiel des Jahres to community-voted Golden Geek awards, these honors
          help you discover the best games in the hobby.
        </p>
      </div>

      {/* American Awards */}
      {americanAwards.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🇺🇸</span>
            American Awards
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {americanAwards.map((award) => {
              const icon = awardIcons[award.slug] || <Trophy className="h-8 w-8" />

              return (
                <Link key={award.slug} href={`/awards/${award.slug}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{award.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {award.organization} &bull; Est. {award.established_year}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <span className="text-primary">{icon}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {award.description}
                      </p>
                      {award.winnerCount > 0 && (
                        <Badge variant="outline">
                          {award.winnerCount} winner{award.winnerCount !== 1 ? 's' : ''} in our database
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* German Awards */}
      {germanAwards.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <span>🇩🇪</span>
            German Awards
            <Badge variant="secondary">Most Prestigious</Badge>
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {germanAwards.map((award) => {
              const icon = awardIcons[award.slug] || <Trophy className="h-8 w-8" />

              return (
                <Link key={award.slug} href={`/awards/${award.slug}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{award.name}</CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {award.short_name} &bull; Est. {award.established_year}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <span className="text-primary">{icon}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {award.description}
                      </p>
                      {award.winnerCount > 0 && (
                        <Badge variant="outline">
                          {award.winnerCount} winner{award.winnerCount !== 1 ? 's' : ''} in our database
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Other International Awards */}
      {otherAwards.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Globe className="h-5 w-5 text-primary" />
            International Awards
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {otherAwards.map((award) => {
              const icon = awardIcons[award.slug] || <Award className="h-8 w-8" />
              const flag = countryFlags[award.country || ''] || ''

              return (
                <Link key={award.slug} href={`/awards/${award.slug}`}>
                  <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg flex items-center gap-2">
                            {flag && <span>{flag}</span>}
                            {award.name}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground mt-1">
                            {award.organization} &bull; Est. {award.established_year}
                          </p>
                        </div>
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                          <span className="text-primary">{icon}</span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                        {award.description}
                      </p>
                      {award.winnerCount > 0 && (
                        <Badge variant="outline">
                          {award.winnerCount} winner{award.winnerCount !== 1 ? 's' : ''} in our database
                        </Badge>
                      )}
                    </CardContent>
                  </Card>
                </Link>
              )
            })}
          </div>
        </div>
      )}

      {/* Browse All CTA */}
      <div className="mt-12 text-center">
        <p className="text-muted-foreground mb-4">
          Looking for award-winning games?
        </p>
        <Link
          href="/games"
          className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors"
        >
          Browse All Games
        </Link>
      </div>
    </div>
  )
}
