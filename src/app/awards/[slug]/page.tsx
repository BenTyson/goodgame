import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft, Trophy, Award, Star, Globe, ExternalLink, Calendar } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  getAwardWithCategories,
  getAwardWinners,
  getAwards,
  getAllAwardSlugs,
} from '@/lib/supabase/queries'

interface AwardPageProps {
  params: Promise<{ slug: string }>
}

// Icon mapping for awards
const awardIcons: Record<string, React.ReactNode> = {
  'spiel-des-jahres': <Trophy className="h-6 w-6" />,
  'kennerspiel-des-jahres': <Star className="h-6 w-6" />,
  'kinderspiel-des-jahres': <Award className="h-6 w-6" />,
  'golden-geek': <Star className="h-6 w-6" />,
  'dice-tower': <Award className="h-6 w-6" />,
  'as-dor': <Globe className="h-6 w-6" />,
  'american-tabletop': <Trophy className="h-6 w-6" />,
  'origins-awards': <Award className="h-6 w-6" />,
  'mensa-select': <Star className="h-6 w-6" />,
  'deutscher-spiele-preis': <Trophy className="h-6 w-6" />,
  'international-gamers-award': <Globe className="h-6 w-6" />,
}

// Country flags
const countryFlags: Record<string, string> = {
  'Germany': '🇩🇪',
  'USA': '🇺🇸',
  'France': '🇫🇷',
  'International': '🌍',
}

export async function generateMetadata({
  params,
}: AwardPageProps): Promise<Metadata> {
  const { slug } = await params
  const award = await getAwardWithCategories(slug)

  if (!award) {
    return {
      title: 'Award Not Found',
    }
  }

  return {
    title: `${award.name} Winners`,
    description: `${award.description} Browse ${award.name} winning board games with rules, score sheets, and setup guides.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllAwardSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function AwardPage({ params }: AwardPageProps) {
  const { slug } = await params
  const [award, winners, allAwards] = await Promise.all([
    getAwardWithCategories(slug),
    getAwardWinners(slug),
    getAwards(),
  ])

  if (!award) {
    notFound()
  }

  const icon = awardIcons[slug] || <Trophy className="h-6 w-6" />
  const flag = countryFlags[award.country || ''] || ''

  // Group winners by year
  const winnersByYear = winners.reduce((acc, winner) => {
    const year = winner.year
    if (!acc[year]) acc[year] = []
    acc[year].push(winner)
    return acc
  }, {} as Record<number, typeof winners>)

  const years = Object.keys(winnersByYear)
    .map(Number)
    .sort((a, b) => b - a)

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb & Back */}
      <div className="mb-6 flex items-center justify-between">
        <nav className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/awards" className="hover:text-foreground">
            Awards
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{award.short_name || award.name}</span>
        </nav>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/awards">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Awards
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
            <span className="text-primary">{icon}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl flex items-center gap-2">
              {flag && <span>{flag}</span>}
              {award.name}
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <span>{award.organization}</span>
              <span>&bull;</span>
              <span>Est. {award.established_year}</span>
              {award.country && (
                <>
                  <span>&bull;</span>
                  <span>{award.country}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {award.description && (
          <p className="text-lg text-muted-foreground max-w-2xl mb-4">
            {award.description}
          </p>
        )}

        {award.website_url && (
          <a
            href={award.website_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline text-sm"
          >
            Official Website
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>

      {/* Categories */}
      {award.categories && award.categories.length > 1 && (
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-3">Award Categories</h2>
          <div className="flex flex-wrap gap-2">
            {award.categories.map((cat) => (
              <Badge key={cat.id} variant="secondary" className="text-sm">
                {cat.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Winners by Year */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          Winners in Our Database
        </h2>

        {years.length > 0 ? (
          <div className="space-y-8">
            {years.map((year) => (
              <div key={year}>
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  {year}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {winnersByYear[year].map((winner) => (
                    <Link key={`${winner.game.slug}-${winner.category?.slug || 'main'}`} href={`/games/${winner.game.slug}`}>
                      <Card className="h-full transition-all hover:shadow-md hover:border-primary/30">
                        <CardContent className="p-4">
                          <div className="flex gap-4">
                            {winner.game.thumbnail_url && (
                              <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                                <Image
                                  src={winner.game.thumbnail_url}
                                  alt={winner.game.name}
                                  fill
                                  className="object-cover"
                                  sizes="64px"
                                />
                              </div>
                            )}
                            <div className="min-w-0 flex-1">
                              <h4 className="font-semibold truncate">{winner.game.name}</h4>
                              {winner.category && (
                                <p className="text-sm text-muted-foreground truncate">
                                  {winner.category.name}
                                </p>
                              )}
                              <Badge
                                variant={winner.result === 'winner' ? 'default' : 'secondary'}
                                className="mt-2 text-xs"
                              >
                                {winner.result === 'winner' ? 'Winner' : winner.result}
                              </Badge>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <Trophy className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No winners from this award in our database yet.
            </p>
            <Button variant="outline" asChild>
              <Link href="/games">Browse All Games</Link>
            </Button>
          </div>
        )}
      </div>

      {/* Other Awards */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Other Awards</h2>
        <div className="flex flex-wrap gap-3">
          {allAwards
            .filter((a) => a.slug !== slug)
            .map((otherAward) => {
              const otherIcon = awardIcons[otherAward.slug] || <Award className="h-4 w-4" />
              const otherFlag = countryFlags[otherAward.country || ''] || ''

              return (
                <Link
                  key={otherAward.slug}
                  href={`/awards/${otherAward.slug}`}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border bg-primary/10 hover:border-primary/30 transition-colors"
                >
                  <span className="text-primary">{otherIcon}</span>
                  {otherFlag && <span>{otherFlag}</span>}
                  <span className="font-medium">{otherAward.short_name || otherAward.name}</span>
                </Link>
              )
            })}
        </div>
      </div>
    </div>
  )
}
