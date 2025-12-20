import { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, Brain, Users, Gamepad2, HandshakeIcon, UserRound } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { GameGrid } from '@/components/games/GameGrid'
import { getCategoryBySlug, getGamesByCategory, getCategories, getAllCategorySlugs } from '@/lib/supabase/queries'

interface CategoryPageProps {
  params: Promise<{ slug: string }>
}

// Icon mapping for categories
const categoryIcons: Record<string, React.ReactNode> = {
  strategy: <Brain className="h-6 w-6" />,
  family: <Users className="h-6 w-6" />,
  party: <Gamepad2 className="h-6 w-6" />,
  cooperative: <HandshakeIcon className="h-6 w-6" />,
  'two-player': <UserRound className="h-6 w-6" />,
}

// Unified primary color style
const categoryStyle = {
  bg: 'bg-primary/10',
  text: 'text-primary',
  border: 'border-border'
}

export async function generateMetadata({
  params,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params
  const category = await getCategoryBySlug(slug)

  if (!category) {
    return {
      title: 'Category Not Found',
    }
  }

  return {
    title: `${category.name} Board Games`,
    description: `Browse our collection of ${category.name.toLowerCase()} board games. ${category.description} Find rules, score sheets, and setup guides.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllCategorySlugs()
  return slugs.map((slug) => ({ slug }))
}

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params
  const [category, gamesInCategory, allCategories] = await Promise.all([
    getCategoryBySlug(slug),
    getGamesByCategory(slug),
    getCategories()
  ])

  if (!category) {
    notFound()
  }

  const icon = categoryIcons[slug] || <Brain className="h-6 w-6" />

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb & Back */}
      <div className="mb-6 flex items-center justify-between">
        <nav className="text-sm text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Home
          </Link>
          <span className="mx-2">/</span>
          <Link href="/games" className="hover:text-foreground">
            Games
          </Link>
          <span className="mx-2">/</span>
          <span className="text-foreground">{category.name}</span>
        </nav>
        <Button variant="ghost" size="sm" asChild>
          <Link href="/games">
            <ArrowLeft className="mr-2 h-4 w-4" />
            All Games
          </Link>
        </Button>
      </div>

      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-xl ${categoryStyle.bg}`}>
            <span className={categoryStyle.text}>{icon}</span>
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {category.name} Games
            </h1>
            <p className="text-muted-foreground mt-1">
              {gamesInCategory.length} games in this category
            </p>
          </div>
        </div>

        {category.description && (
          <p className="text-lg text-muted-foreground max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Games Grid */}
      {gamesInCategory.length > 0 ? (
        <GameGrid games={gamesInCategory} />
      ) : (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            No games in this category yet.
          </p>
          <Button variant="outline" asChild>
            <Link href="/games">Browse All Games</Link>
          </Button>
        </div>
      )}

      {/* Related Categories */}
      <div className="mt-12">
        <h2 className="text-xl font-bold mb-4">Other Categories</h2>
        <div className="flex flex-wrap gap-3">
          {allCategories
            .filter((c) => c.slug !== slug)
            .map((cat) => {
              const catIcon = categoryIcons[cat.slug] || <Brain className="h-4 w-4" />

              return (
                <Link
                  key={cat.slug}
                  href={`/categories/${cat.slug}`}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${categoryStyle.border} ${categoryStyle.bg} hover:border-primary/30 transition-colors`}
                >
                  <span className={categoryStyle.text}>{catIcon}</span>
                  <span className="font-medium">{cat.name}</span>
                </Link>
              )
            })}
        </div>
      </div>
    </div>
  )
}
