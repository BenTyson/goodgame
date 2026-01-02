import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import {
  Users,
  Clock,
  Brain,
  Calendar,
  ExternalLink,
  BookOpen,
  FileText,
  ListChecks,
  Bookmark,
  Building2,
  ArrowLeft,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { ImageGallery, RelatedGamesAsync, RelatedGamesSkeleton, AwardBadgeList, FamilyBadge } from '@/components/games'
import { createAdminClient } from '@/lib/supabase/server'
import { getGameAwards, getGameFamily } from '@/lib/supabase/queries'
import { getInitials, getInitialsColor } from '@/components/publishers'

interface PreviewPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({
  params,
}: PreviewPageProps): Promise<Metadata> {
  const { id } = await params

  return {
    title: `Preview: Game ${id}`,
    robots: 'noindex, nofollow',
  }
}

async function getGameById(id: string) {
  const supabase = createAdminClient()

  // Get game with all relations
  const { data: game, error } = await supabase
    .from('games')
    .select(`
      *,
      categories:game_categories(category:categories(id, name, slug)),
      mechanics:game_mechanics(mechanic:mechanics(id, name, slug)),
      designers_list:game_designers(designer:designers(id, name, slug)),
      publishers_list:game_publishers(publisher:publishers(id, name, slug, logo_url, website, description)),
      complexity_tier:complexity_tiers(id, name, slug, description)
    `)
    .eq('id', id)
    .single()

  if (error || !game) {
    return null
  }

  // Transform relations
  const transformedGame = {
    ...game,
    categories: game.categories?.map((c: { category: unknown }) => c.category).filter(Boolean) || [],
    mechanics: game.mechanics?.map((m: { mechanic: unknown }) => m.mechanic).filter(Boolean) || [],
    designers_list: game.designers_list?.map((d: { designer: unknown }) => d.designer).filter(Boolean) || [],
    publishers_list: game.publishers_list?.map((p: { publisher: unknown }) => p.publisher).filter(Boolean) || [],
    complexity_tier: game.complexity_tier || null,
  }

  // Get images
  const { data: images } = await supabase
    .from('game_images')
    .select('*')
    .eq('game_id', id)
    .order('display_order')

  return {
    ...transformedGame,
    images: images || []
  }
}

const contentSections = [
  {
    key: 'has_rules',
    title: 'How to Play',
    description: 'Quick rules summary to get you started',
    icon: BookOpen,
    href: 'rules',
  },
  {
    key: 'has_score_sheet',
    title: 'Score Sheet',
    description: 'Printable PDF for tracking scores',
    icon: FileText,
    href: 'score-sheet',
  },
  {
    key: 'has_setup_guide',
    title: 'Setup Guide',
    description: 'Step-by-step setup with checklist',
    icon: ListChecks,
    href: 'setup',
  },
  {
    key: 'has_reference',
    title: 'Quick Reference',
    description: 'Turn structure and scoring summary',
    icon: Bookmark,
    href: 'reference',
  },
]

export default async function GamePreviewPage({ params }: PreviewPageProps) {
  const { id } = await params
  const game = await getGameById(id)

  if (!game) {
    notFound()
  }

  const availableSections = contentSections.filter(
    (section) => game[section.key as keyof typeof game]
  )

  const missingSections = contentSections.filter(
    (section) => !game[section.key as keyof typeof game]
  )

  const [gameAwards, gameFamily] = await Promise.all([
    getGameAwards(game.id),
    getGameFamily(game.id),
  ])

  // Check for missing critical content
  const missingContent = []
  if (!game.tagline) missingContent.push('Tagline')
  if (!game.description) missingContent.push('Description')
  if (!game.box_image_url && (!game.images || game.images.length === 0)) missingContent.push('Images')
  // Check for crunch_score (new) or bncs_score (legacy) - supports pre/post migration
  const gameAny = game as unknown as Record<string, unknown>
  const crunchScore = (gameAny.crunch_score ?? gameAny.bncs_score) as number | null
  if (!game.weight && !crunchScore) missingContent.push('Crunch Score')

  return (
    <div className="min-h-screen bg-background">
      {/* Preview Banner */}
      <div className="sticky top-0 z-50 bg-amber-500 text-amber-950 py-3 px-4">
        <div className="container flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="h-5 w-5" />
            <span className="font-medium">Preview Mode</span>
            <span className="text-amber-800">This is how the game page will appear to visitors</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-white/90 hover:bg-white border-amber-600"
              asChild
            >
              <Link href={`/admin/games/${id}`}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Editor
              </Link>
            </Button>
            {game.slug && (
              <Button
                variant="outline"
                size="sm"
                className="bg-white/90 hover:bg-white border-amber-600"
                asChild
              >
                <Link href={`/games/${game.slug}`} target="_blank">
                  View Live
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Missing Content Warning */}
      {(missingContent.length > 0 || missingSections.length > 0) && (
        <div className="bg-amber-50 border-b border-amber-200 py-3 px-4">
          <div className="container">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                {missingContent.length > 0 && (
                  <p className="text-sm text-amber-800">
                    <span className="font-medium">Missing content:</span>{' '}
                    {missingContent.join(', ')}
                  </p>
                )}
                {missingSections.length > 0 && (
                  <p className="text-sm text-amber-700">
                    <span className="font-medium">Unavailable sections:</span>{' '}
                    {missingSections.map(s => s.title).join(', ')}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Page Content (mirrors public page) */}
      <div className="container py-8 md:py-12">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-muted-foreground">
          <span className="text-muted-foreground/60">Games</span>
          <span className="mx-2">/</span>
          <span className="text-foreground">{game.name}</span>
        </nav>

        {/* Hero section */}
        <div className="grid gap-8 lg:grid-cols-3">
          {/* Game images */}
          <div className="lg:col-span-1">
            {game.images && game.images.length > 0 ? (
              <ImageGallery images={game.images} gameName={game.name} />
            ) : (
              <div className="relative aspect-square overflow-hidden rounded-xl bg-muted">
                {game.box_image_url ? (
                  <Image
                    src={game.box_image_url}
                    alt={game.name}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-dashed border-muted-foreground/30">
                    <div className="text-center p-4">
                      <EyeOff className="h-12 w-12 mx-auto text-muted-foreground/50 mb-2" />
                      <p className="text-sm text-muted-foreground">No image</p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Game info */}
          <div className="lg:col-span-2">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              {(game.categories as { slug: string; name: string }[] | undefined)?.map((category) => (
                <Badge key={category.slug} variant="secondary">
                  {category.name}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl font-bold tracking-tight md:text-4xl lg:text-5xl">
              {game.name}
            </h1>

            {game.tagline ? (
              <p className="mt-2 text-xl text-muted-foreground">{game.tagline}</p>
            ) : (
              <p className="mt-2 text-xl text-muted-foreground/50 italic">No tagline set</p>
            )}

            {/* Quick stats */}
            <div className="mt-6 flex flex-wrap gap-4">
              <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">Players</p>
                  <p className="font-medium">
                    {game.player_count_min === game.player_count_max
                      ? game.player_count_min
                      : `${game.player_count_min}-${game.player_count_max}`}
                    {game.player_count_best && game.player_count_best.length > 0 && (
                      <span className="text-muted-foreground">
                        {' '}
                        (best: {game.player_count_best.join(', ')})
                      </span>
                    )}
                  </p>
                </div>
              </div>

              {game.play_time_min && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Play Time</p>
                    <p className="font-medium">
                      {game.play_time_min === game.play_time_max
                        ? `${game.play_time_min} min`
                        : `${game.play_time_min}-${game.play_time_max} min`}
                    </p>
                  </div>
                </div>
              )}

              {(game.weight || crunchScore) && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <Brain className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Crunch</p>
                    <p className="font-medium">
                      {crunchScore ? `${Number(crunchScore).toFixed(1)} / 10` : `${(game.weight || 0).toFixed(1)} / 5 BGG`}
                      {game.complexity_tier && (
                        <span className="ml-2 text-sm text-muted-foreground">
                          ({game.complexity_tier.name})
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              )}

              {game.year_published && (
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2">
                  <Calendar className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground">Published</p>
                    <p className="font-medium">{game.year_published}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Designer & Publisher */}
            {(((game.designers_list as unknown[])?.length) || ((game.publishers_list as unknown[])?.length) || ((game.designers as string[])?.length) || game.publisher) && (
              <div className="mt-4 text-sm text-muted-foreground">
                {(game.designers_list as { id: string; name: string }[] | undefined) && (game.designers_list as unknown[]).length > 0 ? (
                  <p>
                    <span className="font-medium text-foreground">Designer:</span>{' '}
                    {(game.designers_list as { id: string; name: string }[]).map((designer, idx) => (
                      <span key={designer.id}>
                        {designer.name}
                        {idx < (game.designers_list as unknown[]).length - 1 && ', '}
                      </span>
                    ))}
                  </p>
                ) : (game.designers as string[] | undefined) && (game.designers as string[]).length > 0 ? (
                  <p>
                    <span className="font-medium text-foreground">Designer:</span>{' '}
                    {(game.designers as string[]).join(', ')}
                  </p>
                ) : null}
                {(game.publishers_list as { id: string; name: string }[] | undefined) && (game.publishers_list as unknown[]).length > 0 ? (
                  <p>
                    <span className="font-medium text-foreground">Publisher:</span>{' '}
                    {(game.publishers_list as { id: string; name: string }[]).map((publisher, idx) => (
                      <span key={publisher.id}>
                        {publisher.name}
                        {idx < (game.publishers_list as unknown[]).length - 1 && ', '}
                      </span>
                    ))}
                  </p>
                ) : game.publisher ? (
                  <p>
                    <span className="font-medium text-foreground">Publisher:</span>{' '}
                    {game.publisher}
                  </p>
                ) : null}
              </div>
            )}

            {/* Awards */}
            {gameAwards.length > 0 && (
              <div className="mt-6">
                <p className="text-sm font-medium text-foreground mb-2">Awards</p>
                <AwardBadgeList
                  awards={gameAwards}
                  variant="compact"
                  limit={4}
                />
              </div>
            )}

            {/* Game Family */}
            {gameFamily && (
              <div className="mt-6">
                <FamilyBadge family={gameFamily} />
              </div>
            )}

            {/* Placeholder for buy buttons */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Button disabled className="opacity-50">
                Buy Buttons (disabled in preview)
              </Button>
              <Button variant="outline" disabled className="opacity-50">
                Add to Shelf (disabled in preview)
              </Button>
            </div>
          </div>
        </div>

        <Separator className="my-10" />

        {/* Content sections */}
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-6">
            Game Resources
          </h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {availableSections.map((section) => (
              <div key={section.key} className="group">
                <Card className="h-full transition-all duration-300 border-green-500/30 bg-green-500/10">
                  <CardHeader className="pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-500/20">
                      <section.icon className="h-6 w-6 text-green-500" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg">{section.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {section.description}
                    </p>
                    <Badge variant="outline" className="mt-2 text-green-500 border-green-500/50">
                      Available
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            ))}
            {missingSections.map((section) => (
              <div key={section.key} className="group opacity-50">
                <Card className="h-full transition-all duration-300 border-dashed border-muted-foreground/30">
                  <CardHeader className="pb-2">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-muted/50">
                      <section.icon className="h-6 w-6 text-muted-foreground" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <CardTitle className="text-lg text-muted-foreground">{section.title}</CardTitle>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {section.description}
                    </p>
                    <Badge variant="outline" className="mt-2 text-muted-foreground border-muted-foreground/30">
                      Not Available
                    </Badge>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* Description */}
        <>
          <Separator className="my-10" />
          <div>
            <h2 className="text-2xl font-bold tracking-tight mb-4">
              About {game.name}
            </h2>
            {game.description ? (
              <p className="text-muted-foreground leading-relaxed max-w-3xl">
                {game.description}
              </p>
            ) : (
              <p className="text-muted-foreground/50 italic max-w-3xl">
                No description set. Add a description in the Game Details tab.
              </p>
            )}
          </div>
        </>

        {/* About the Publisher */}
        {(game.publishers_list as unknown[] | undefined) && (game.publishers_list as unknown[]).length > 0 && (
          <>
            <Separator className="my-10" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-6">
                About the Publisher
              </h2>
              {(game.publishers_list as { id: string; name: string; logo_url?: string; description?: string; website?: string; slug: string }[]).slice(0, 1).map((publisher) => {
                const initials = getInitials(publisher.name)
                const colorClass = getInitialsColor(publisher.name)
                return (
                  <div key={publisher.id} className="flex flex-col sm:flex-row gap-6">
                    {/* Publisher Logo/Initials */}
                    <div className="shrink-0">
                      {publisher.logo_url ? (
                        <Image
                          src={publisher.logo_url}
                          alt={publisher.name}
                          width={80}
                          height={80}
                          className="rounded-xl object-contain"
                        />
                      ) : (
                        <div className={`flex h-20 w-20 items-center justify-center rounded-xl ${colorClass} text-white font-bold text-2xl`}>
                          {initials}
                        </div>
                      )}
                    </div>

                    {/* Publisher Info */}
                    <div className="flex-1">
                      <span className="text-xl font-semibold">
                        {publisher.name}
                      </span>
                      {publisher.description ? (
                        <p className="mt-2 text-muted-foreground leading-relaxed max-w-2xl">
                          {publisher.description}
                        </p>
                      ) : (
                        <p className="mt-2 text-muted-foreground leading-relaxed max-w-2xl">
                          {publisher.name} is a board game publisher known for creating engaging tabletop experiences.
                        </p>
                      )}
                      <div className="mt-4 flex flex-wrap gap-3">
                        <Button variant="outline" size="sm" disabled className="opacity-50">
                          <Building2 className="h-4 w-4 mr-2" />
                          View All Games
                        </Button>
                        {publisher.website && (
                          <Button variant="outline" size="sm" disabled className="opacity-50">
                            Visit Website
                            <ExternalLink className="h-4 w-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Reviews Section Placeholder */}
        <Separator className="my-10" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Community Reviews
          </h2>
          <p className="text-muted-foreground/50 italic">
            Reviews section will appear here on the live page.
          </p>
        </div>

        {/* External links */}
        {game.bgg_id && (
          <>
            <Separator className="my-10" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                External Links
              </h2>
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" disabled className="opacity-50">
                  BoardGameGeek
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </>
        )}

        {/* Related games placeholder */}
        <Separator className="my-10" />
        <div>
          <h2 className="text-2xl font-bold tracking-tight mb-4">
            Related Games
          </h2>
          {game.slug ? (
            <Suspense fallback={<RelatedGamesSkeleton />}>
              <RelatedGamesAsync gameSlug={game.slug} />
            </Suspense>
          ) : (
            <p className="text-muted-foreground/50 italic">
              Related games will appear here once the game has a slug.
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
