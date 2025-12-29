import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  BookOpen,
  FileText,
  ListChecks,
  Bookmark,
  Brain,
  Users,
  PartyPopper,
  Handshake,
  User2,
  Clock,
  Star,
  Sparkles,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { GameGrid } from '@/components/games'
import { getFeaturedGames, getFeaturedGame, getCategories } from '@/lib/supabase/queries'

const contentTypes = [
  {
    icon: BookOpen,
    title: 'Rules Summaries',
    description: 'Condensed how-to-play guides that get you gaming fast',
    href: '/rules',
  },
  {
    icon: FileText,
    title: 'Score Sheets',
    description: 'Printable PDFs generated in your browser, ready for game night',
    href: '/score-sheets',
  },
  {
    icon: ListChecks,
    title: 'Setup Guides',
    description: 'Step-by-step setup with component checklists',
    href: '/games',
  },
  {
    icon: Bookmark,
    title: 'Quick Reference',
    description: 'Turn structure, actions, and scoring at a glance',
    href: '/games',
  },
]

const categoryIcons: Record<string, React.ElementType> = {
  strategy: Brain,
  family: Users,
  party: PartyPopper,
  cooperative: Handshake,
  'two-player': User2,
}

export default async function HomePage() {
  const [featuredGames, featuredGame, categories] = await Promise.all([
    getFeaturedGames(6),
    getFeaturedGame(),
    getCategories()
  ])
  const primaryCategories = categories.filter((cat) => cat.is_primary)

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b bg-gradient-to-b from-primary/5 via-background to-background">
        {/* Animated background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-1/3 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/10 blur-3xl animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute top-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-amber-500/8 blur-3xl animate-pulse" style={{ animationDuration: '5s', animationDelay: '1s' }} />
        </div>

        <div className="container py-20 md:py-32">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge/eyebrow */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              For the Obsessed
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              The{' '}
              <span className="text-primary relative">
                Board Game Guide
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full" />
              </span>
            </h1>

            <p className="mt-8 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed">
              Publishers, designers, awards, mechanics—plus rules and score sheets.
              Built for collectors and enthusiasts.
            </p>

            <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Button size="lg" className="group" asChild>
                <Link href="/games">
                  Browse Games
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="group" asChild>
                <Link href="/recommend">
                  <Star className="mr-2 h-4 w-4" />
                  Find Your Perfect Game
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Content Types Section */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Everything You Need for Game Night
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Four tools designed to make teaching, playing, and tracking board
            games easier.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {contentTypes.map((type) => (
            <Link key={type.title} href={type.href} className="group">
              <Card
                className="h-full [box-shadow:var(--shadow-card)] hover:[box-shadow:var(--shadow-card-hover)] transition-all duration-300 hover:-translate-y-1.5 hover:border-primary/30"
              >
                <CardHeader>
                  <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:[box-shadow:var(--shadow-glow-primary)]">
                    <type.icon className="h-7 w-7 text-primary" />
                  </div>
                  <CardTitle className="mt-4 text-lg">{type.title}</CardTitle>
                  <CardDescription className="leading-relaxed">{type.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </section>

      {/* Featured Game Section */}
      {featuredGame && (
        <section className="relative overflow-hidden border-y">
          {/* Background Image */}
          <div className="absolute inset-0">
            {featuredGame.hero_image_url || featuredGame.box_image_url ? (
              <Image
                src={featuredGame.hero_image_url || featuredGame.box_image_url || ''}
                alt={featuredGame.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary/20 to-primary/5" />
            )}
            {/* Gradient overlays - balanced for readability and image visibility */}
            <div className="absolute inset-0 bg-gradient-to-r from-background/95 via-background/80 to-background/50" />
            <div className="absolute inset-0 bg-gradient-to-t from-background/85 via-background/20 to-background/40" />
          </div>

          <div className="container relative py-16 md:py-24">
            <div className="max-w-2xl">
              {/* Featured Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/60 text-primary text-sm font-medium mb-6 backdrop-blur-sm border border-primary/20">
                <Sparkles className="h-4 w-4" />
                Featured Game
              </div>

              {/* Game Title */}
              <h2 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl drop-shadow-sm">
                {featuredGame.name}
              </h2>

              {/* Tagline */}
              {featuredGame.tagline && (
                <p className="mt-4 text-xl text-muted-foreground drop-shadow-sm">
                  {featuredGame.tagline}
                </p>
              )}

              {/* Stats Row */}
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/70 backdrop-blur-sm border text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">
                    {featuredGame.player_count_min === featuredGame.player_count_max
                      ? featuredGame.player_count_min
                      : `${featuredGame.player_count_min}-${featuredGame.player_count_max}`} players
                  </span>
                </div>
                {featuredGame.play_time_min && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/70 backdrop-blur-sm border text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {featuredGame.play_time_min === featuredGame.play_time_max
                        ? `${featuredGame.play_time_min} min`
                        : `${featuredGame.play_time_min}-${featuredGame.play_time_max} min`}
                    </span>
                  </div>
                )}
                {featuredGame.weight && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-background/70 backdrop-blur-sm border text-sm">
                    <Brain className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{featuredGame.weight.toFixed(1)} / 5</span>
                  </div>
                )}
              </div>

              {/* Categories */}
              {featuredGame.categories && featuredGame.categories.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {featuredGame.categories.slice(0, 3).map((category) => (
                    <Badge key={category.slug} variant="secondary" className="backdrop-blur-sm bg-background/60">
                      {category.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* Publisher */}
              {featuredGame.publishers_list && featuredGame.publishers_list.length > 0 && (
                <p className="mt-4 text-sm text-muted-foreground">
                  Published by{' '}
                  <Link
                    href={`/publishers/${featuredGame.publishers_list[0].slug}`}
                    className="font-medium text-foreground hover:text-primary transition-colors"
                  >
                    {featuredGame.publishers_list[0].name}
                  </Link>
                </p>
              )}

              {/* Available Resources */}
              <div className="mt-6 flex flex-wrap items-center gap-2">
                {featuredGame.has_rules && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/20 backdrop-blur-sm text-primary text-xs font-medium">
                    <BookOpen className="h-3.5 w-3.5" />
                    Rules
                  </div>
                )}
                {featuredGame.has_score_sheet && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/20 backdrop-blur-sm text-primary text-xs font-medium">
                    <FileText className="h-3.5 w-3.5" />
                    Score Sheet
                  </div>
                )}
                {featuredGame.has_setup_guide && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/20 backdrop-blur-sm text-primary text-xs font-medium">
                    <ListChecks className="h-3.5 w-3.5" />
                    Setup Guide
                  </div>
                )}
                {featuredGame.has_reference && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/20 backdrop-blur-sm text-primary text-xs font-medium">
                    <Bookmark className="h-3.5 w-3.5" />
                    Reference
                  </div>
                )}
              </div>

              {/* CTA */}
              <div className="mt-8">
                <Button size="lg" className="group" asChild>
                  <Link href={`/games/${featuredGame.slug}`}>
                    Explore {featuredGame.name}
                    <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Featured Games Section */}
      <section className="border-b bg-muted/50">
        <div className="container py-16 md:py-24">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
                Featured Games
              </h2>
              <p className="mt-2 text-muted-foreground text-lg">
                Popular games with complete reference materials
              </p>
            </div>
            <Button variant="outline" asChild className="hidden sm:flex group">
              <Link href="/games">
                View All
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </div>

          <div className="mt-10">
            <GameGrid games={featuredGames} columns={3} />
          </div>

          <div className="mt-8 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link href="/games">
                View All Games
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Recommendation CTA Section */}
      <section className="container py-16 md:py-24">
        <Card className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-primary/20">
          <CardContent className="py-12 md:py-16 text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 rounded-2xl bg-primary/10">
                <Sparkles className="h-10 w-10 text-primary" />
              </div>
            </div>
            <h2 className="text-2xl md:text-3xl font-bold tracking-tight mb-4">
              Not Sure Where to Start?
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl mx-auto mb-8">
              Answer a few quick questions and we will find your perfect game match.
              Takes less than 2 minutes.
            </p>
            <Button size="lg" className="group" asChild>
              <Link href="/recommend">
                Find Your Perfect Game
                <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </section>

      {/* Categories Section */}
      <section className="container py-16 md:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Browse by Category
          </h2>
          <p className="mt-4 text-muted-foreground text-lg">
            Find games that match your play style
          </p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {primaryCategories.map((category) => {
            const Icon = categoryIcons[category.slug] || Brain
            return (
              <Link key={category.slug} href={`/categories/${category.slug}`} className="group">
                <Card className="h-full [box-shadow:var(--shadow-sm)] hover:[box-shadow:var(--shadow-card-hover)] transition-all duration-300 hover:border-primary/30 hover:-translate-y-1.5">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 transition-all duration-300 group-hover:scale-110 group-hover:[box-shadow:var(--shadow-glow-primary)]">
                      <Icon className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="mt-4 font-semibold text-lg">{category.name}</h3>
                    <p className="mt-2 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {category.description}
                    </p>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative border-t bg-gradient-to-b from-primary/5 to-primary/10 overflow-hidden">
        {/* Decorative glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-primary/10 blur-3xl pointer-events-none" />

        <div className="container py-16 md:py-24 relative">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
              Start Exploring
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Browse our growing library of games, publishers, and awards.
              Your next obsession is waiting.
            </p>
            <div className="mt-8">
              <Button size="lg" className="group" asChild>
                <Link href="/games">
                  Explore All Games
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
