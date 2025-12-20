import Link from 'next/link'
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
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { GameGrid } from '@/components/games'
import { getFeaturedGames, getCategories } from '@/lib/supabase/queries'

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
  const featuredGames = await getFeaturedGames(6)
  const categories = await getCategories()
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
              Game Night Made Easy
            </div>

            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
              Beautiful Board Game{' '}
              <span className="text-primary relative">
                Reference Tools
                <span className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/60 to-transparent rounded-full" />
              </span>
            </h1>

            <p className="mt-8 text-lg text-muted-foreground md:text-xl max-w-2xl mx-auto leading-relaxed">
              Rules summaries, printable score sheets, setup guides, and quick
              reference cards for your favorite board games. Get to the fun faster.
            </p>

            <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
              <Button size="lg" className="group" asChild>
                <Link href="/games">
                  Browse Games
                  <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/score-sheets">Score Sheets</Link>
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

      {/* Featured Games Section */}
      <section className="border-y bg-muted/50">
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
              Ready to Play?
            </h2>
            <p className="mt-4 text-muted-foreground text-lg leading-relaxed">
              Search our library of games to find rules, score sheets, and
              reference cards. Game night made easy.
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
