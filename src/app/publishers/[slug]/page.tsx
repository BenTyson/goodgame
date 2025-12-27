import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ExternalLink, Trophy, Star, Calendar, Gamepad2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { GameGrid } from '@/components/games'
import { getInitials, getInitialsColor } from '@/components/publishers'
import {
  getPublisherBySlug,
  getGamesByPublisher,
  getAllPublisherSlugs,
  getPublisherStats,
  getPublisherAwards
} from '@/lib/supabase/queries'

interface PublisherPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PublisherPageProps): Promise<Metadata> {
  const { slug } = await params
  const publisher = await getPublisherBySlug(slug)

  if (!publisher) {
    return {
      title: 'Publisher Not Found',
    }
  }

  return {
    title: `${publisher.name} - Board Game Publisher`,
    description: publisher.description || `Browse board games published by ${publisher.name}.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllPublisherSlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function PublisherPage({ params }: PublisherPageProps) {
  const { slug } = await params
  const publisher = await getPublisherBySlug(slug)

  if (!publisher) {
    notFound()
  }

  const [games, stats, awards] = await Promise.all([
    getGamesByPublisher(slug),
    getPublisherStats(publisher.id),
    getPublisherAwards(publisher.id)
  ])

  const initials = getInitials(publisher.name)
  const colorClass = getInitialsColor(publisher.name)

  // Format year range display
  const yearDisplay = stats.year_range.earliest
    ? stats.year_range.earliest === stats.year_range.latest
      ? String(stats.year_range.earliest)
      : `${stats.year_range.earliest}-${stats.year_range.latest}`
    : '-'

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/publishers" className="hover:text-foreground transition-colors">
          Publishers
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{publisher.name}</span>
      </nav>

      {/* Hero Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Large Logo or Initials */}
          <div className="relative h-24 w-24 shrink-0 rounded-xl overflow-hidden shadow-md">
            {publisher.logo_url ? (
              <Image
                src={publisher.logo_url}
                alt={publisher.name}
                fill
                className="object-contain bg-white"
                sizes="96px"
                priority
              />
            ) : (
              <div className={`flex h-full w-full items-center justify-center ${colorClass} text-white font-bold text-3xl`}>
                {initials}
              </div>
            )}
          </div>

          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {publisher.name}
            </h1>
            {publisher.description && (
              <p className="mt-3 text-muted-foreground max-w-3xl">
                {publisher.description}
              </p>
            )}
            {publisher.website && (
              <Button variant="outline" size="sm" className="mt-4" asChild>
                <a
                  href={publisher.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="gap-2"
                >
                  Visit Website
                  <ExternalLink className="h-4 w-4" />
                </a>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4 mb-10">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Gamepad2 className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Games</p>
              <p className="text-2xl font-bold">{stats.total_games}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Star className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg. Weight</p>
              <p className="text-2xl font-bold">
                {stats.average_rating ? stats.average_rating.toFixed(1) : '-'}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Years Active</p>
              <p className="text-2xl font-bold">{yearDisplay}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Trophy className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Awards</p>
              <p className="text-2xl font-bold">{stats.total_awards}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Games Section */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold tracking-tight mb-6">
          Games by {publisher.name}
        </h2>
        {games.length === 0 ? (
          <div className="text-center py-12 bg-muted/30 rounded-lg">
            <p className="text-muted-foreground">No published games found for this publisher.</p>
          </div>
        ) : (
          <GameGrid games={games} />
        )}
      </section>

      {/* Awards Section */}
      {awards.length > 0 && (
        <>
          <Separator className="my-10" />
          <section>
            <h2 className="text-2xl font-bold tracking-tight mb-6 flex items-center gap-2">
              <Trophy className="h-6 w-6 text-primary" />
              Awards & Recognition
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {awards.map((award, idx) => (
                <Link
                  key={`${award.game.slug}-${award.year}-${idx}`}
                  href={`/games/${award.game.slug}`}
                >
                  <Card className="h-full transition-all duration-200 hover:shadow-md hover:border-primary/30">
                    <CardContent className="p-4">
                      <div className="flex gap-4">
                        {award.game.thumbnail_url || award.game.box_image_url ? (
                          <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-muted">
                            <Image
                              src={award.game.thumbnail_url || award.game.box_image_url || ''}
                              alt={award.game.name}
                              fill
                              className="object-cover"
                              sizes="64px"
                            />
                          </div>
                        ) : (
                          <div className="w-16 h-16 shrink-0 rounded-lg bg-muted flex items-center justify-center">
                            <Gamepad2 className="h-6 w-6 text-muted-foreground" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <h4 className="font-semibold truncate">{award.game.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {award.award.name} {award.year}
                          </p>
                          {award.category && (
                            <p className="text-xs text-muted-foreground truncate">
                              {award.category.name}
                            </p>
                          )}
                          <Badge
                            variant={award.result === 'winner' ? 'default' : 'secondary'}
                            className="mt-2 text-xs"
                          >
                            {award.result === 'winner' ? 'Winner' : award.result || 'Nominated'}
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  )
}
