import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { Users2 } from 'lucide-react'

import {
  getGameFamilyWithGames,
  getAllFamilySlugs,
  getGameRelations,
  getInverseGameRelations
} from '@/lib/supabase/queries'
import { GameGrid } from '@/components/games'
import { Badge } from '@/components/ui/badge'
import type { Game, RelationType } from '@/types/database'
import { RELATION_TYPE_GROUP_LABELS } from '@/types/database'

interface FamilyPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: FamilyPageProps): Promise<Metadata> {
  const { slug } = await params
  const family = await getGameFamilyWithGames(slug)

  if (!family) {
    return {
      title: 'Family Not Found',
    }
  }

  return {
    title: `${family.name} - Game Family`,
    description: family.description || `Browse all games in the ${family.name} family including sequels, expansions, and editions.`,
  }
}

export async function generateStaticParams() {
  const slugs = await getAllFamilySlugs()
  return slugs.map((slug) => ({ slug }))
}

// Group games by their relationship type
async function groupGamesByRelation(games: Game[]): Promise<{
  baseGames: Game[]
  expansions: Game[]
  sequelsPrequels: Game[]
  reimplementations: Game[]
  spinOffs: Game[]
  standalones: Game[]
}> {
  // Get all relations for games in the family
  const relationMap = new Map<string, RelationType[]>()

  await Promise.all(
    games.map(async (game) => {
      const relations = await getGameRelations(game.id)
      const types = relations.map(r => r.relation_type as RelationType)
      relationMap.set(game.id, types)
    })
  )

  const baseGames: Game[] = []
  const expansions: Game[] = []
  const sequelsPrequels: Game[] = []
  const reimplementations: Game[] = []
  const spinOffs: Game[] = []
  const standalones: Game[] = []

  for (const game of games) {
    const types = relationMap.get(game.id) || []

    if (types.includes('expansion_of')) {
      expansions.push(game)
    } else if (types.includes('sequel_to') || types.includes('prequel_to')) {
      sequelsPrequels.push(game)
    } else if (types.includes('reimplementation_of')) {
      reimplementations.push(game)
    } else if (types.includes('spin_off_of')) {
      spinOffs.push(game)
    } else if (types.includes('standalone_in_series')) {
      standalones.push(game)
    } else {
      // No relations or is a base game
      baseGames.push(game)
    }
  }

  return { baseGames, expansions, sequelsPrequels, reimplementations, spinOffs, standalones }
}

export default async function FamilyPage({ params }: FamilyPageProps) {
  const { slug } = await params
  const family = await getGameFamilyWithGames(slug)

  if (!family) {
    notFound()
  }

  const grouped = await groupGamesByRelation(family.games)

  return (
    <div className="container py-8 md:py-12">
      {/* Breadcrumb */}
      <nav className="mb-6 text-sm text-muted-foreground">
        <Link href="/families" className="hover:text-foreground">
          Game Families
        </Link>
        <span className="mx-2">/</span>
        <span className="text-foreground">{family.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        {family.hero_image_url && (
          <div className="relative mb-6 aspect-[3/1] overflow-hidden rounded-lg">
            <Image
              src={family.hero_image_url}
              alt={family.name}
              fill
              className="object-cover"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
          </div>
        )}

        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
            <Users2 className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
              {family.name}
            </h1>
            {family.description && (
              <p className="mt-2 text-muted-foreground max-w-3xl">
                {family.description}
              </p>
            )}
            <div className="mt-3">
              <Badge variant="secondary">
                {family.game_count} {family.game_count === 1 ? 'game' : 'games'}
              </Badge>
            </div>
          </div>
        </div>
      </div>

      {/* Games grouped by type */}
      {family.games.length === 0 ? (
        <p className="text-muted-foreground">No games found in this family.</p>
      ) : (
        <div className="space-y-10">
          {/* Base Games */}
          {grouped.baseGames.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                {grouped.baseGames.length === 1 ? 'Base Game' : 'Base Games'}
              </h2>
              <GameGrid games={grouped.baseGames} />
            </section>
          )}

          {/* Expansions */}
          {grouped.expansions.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                Expansions
              </h2>
              <GameGrid games={grouped.expansions} />
            </section>
          )}

          {/* Sequels & Prequels */}
          {grouped.sequelsPrequels.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                Sequels & Prequels
              </h2>
              <GameGrid games={grouped.sequelsPrequels} />
            </section>
          )}

          {/* Reimplementations */}
          {grouped.reimplementations.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                Reimplementations
              </h2>
              <GameGrid games={grouped.reimplementations} />
            </section>
          )}

          {/* Spin-offs */}
          {grouped.spinOffs.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                Spin-offs
              </h2>
              <GameGrid games={grouped.spinOffs} />
            </section>
          )}

          {/* Standalones */}
          {grouped.standalones.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold tracking-tight mb-4">
                Standalone Games in Series
              </h2>
              <GameGrid games={grouped.standalones} />
            </section>
          )}
        </div>
      )}
    </div>
  )
}
