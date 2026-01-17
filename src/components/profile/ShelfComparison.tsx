'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, Users, Percent, Package } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ShelfComparisonResult } from '@/types/database'

interface UserInfo {
  id: string
  username: string | null
  displayName: string | null
  avatarUrl: string | null
}

interface ShelfComparisonProps {
  currentUser: UserInfo
  targetUser: UserInfo
  comparison: ShelfComparisonResult
  stats: {
    bothCount: number
    onlyUser1Count: number
    onlyUser2Count: number
    overlapPercentage: number
  }
  isFriend: boolean
}

type Tab = 'both' | 'only-you' | 'only-them'

export function ShelfComparison({
  currentUser,
  targetUser,
  comparison,
  stats,
  isFriend,
}: ShelfComparisonProps) {
  const [activeTab, setActiveTab] = useState<Tab>('both')

  const targetDisplayName = targetUser.displayName || targetUser.username || 'User'
  const currentDisplayName = currentUser.displayName || currentUser.username || 'You'

  const tabs = [
    {
      id: 'both' as Tab,
      label: 'Both Have',
      count: stats.bothCount,
      icon: Users,
    },
    {
      id: 'only-you' as Tab,
      label: `Only ${currentDisplayName}`,
      count: stats.onlyUser1Count,
      icon: Package,
    },
    {
      id: 'only-them' as Tab,
      label: `Only ${targetDisplayName}`,
      count: stats.onlyUser2Count,
      icon: Package,
    },
  ]

  const currentGames = activeTab === 'both'
    ? comparison.both
    : activeTab === 'only-you'
      ? comparison.onlyUser1
      : comparison.onlyUser2

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href={`/u/${targetUser.username}`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to profile
          </Link>
        </Button>

        <h1 className="text-2xl font-bold mb-2">Compare Shelves</h1>
        <p className="text-muted-foreground">
          See how your collection compares with{' '}
          <Link href={`/u/${targetUser.username}`} className="text-primary hover:underline">
            @{targetUser.username}
          </Link>
        </p>
      </div>

      {/* Users Comparison Header */}
      <div className="flex items-center justify-center gap-8 p-6 rounded-xl border border-border/50 bg-card/30">
        {/* Current User */}
        <div className="text-center">
          <Avatar className="h-16 w-16 mx-auto mb-2">
            <AvatarImage src={currentUser.avatarUrl || undefined} alt={currentDisplayName} />
            <AvatarFallback>{currentDisplayName.slice(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <p className="font-medium">{currentDisplayName}</p>
          <p className="text-sm text-muted-foreground">
            {stats.bothCount + stats.onlyUser1Count} games
          </p>
        </div>

        {/* VS / Stats */}
        <div className="text-center px-6">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Percent className="h-5 w-5 text-primary" />
            <span className="text-3xl font-bold text-primary">{stats.overlapPercentage}%</span>
          </div>
          <p className="text-sm text-muted-foreground">overlap</p>
          {isFriend && (
            <Badge variant="outline" className="mt-2">
              <Users className="h-3 w-3 mr-1" />
              Friends
            </Badge>
          )}
        </div>

        {/* Target User */}
        <div className="text-center">
          <Link href={`/u/${targetUser.username}`}>
            <Avatar className="h-16 w-16 mx-auto mb-2">
              <AvatarImage src={targetUser.avatarUrl || undefined} alt={targetDisplayName} />
              <AvatarFallback>{targetDisplayName.slice(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
          </Link>
          <Link href={`/u/${targetUser.username}`} className="font-medium hover:text-primary transition-colors">
            {targetDisplayName}
          </Link>
          <p className="text-sm text-muted-foreground">
            {stats.bothCount + stats.onlyUser2Count} games
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-lg bg-green-500/10 border border-green-500/20">
          <p className="text-2xl font-bold text-green-600">{stats.bothCount}</p>
          <p className="text-sm text-muted-foreground">Games in Common</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-2xl font-bold text-primary">{stats.onlyUser1Count}</p>
          <p className="text-sm text-muted-foreground">Only You Have</p>
        </div>
        <div className="text-center p-4 rounded-lg bg-amber-500/10 border border-amber-500/20">
          <p className="text-2xl font-bold text-amber-600">{stats.onlyUser2Count}</p>
          <p className="text-sm text-muted-foreground">Only They Have</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-border">
        <nav className="flex overflow-x-auto scrollbar-hide -mb-px" aria-label="Comparison sections">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id
            const Icon = tab.icon

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap',
                  'border-b-2 transition-colors',
                  isActive
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.label}</span>
                <Badge variant="secondary" className="ml-1 text-xs">
                  {tab.count}
                </Badge>
              </button>
            )
          })}
        </nav>
      </div>

      {/* Games Grid */}
      {currentGames.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-muted-foreground">
            {activeTab === 'both'
              ? 'No games in common yet'
              : activeTab === 'only-you'
                ? "You don't have any games they don't have"
                : "They don't have any games you don't have"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {currentGames.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      )}
    </div>
  )
}

function GameCard({ game }: { game: ShelfComparisonResult['both'][number] }) {
  const imageUrl = game.thumbnailUrl || game.boxImageUrl

  return (
    <Link
      href={`/games/${game.slug}`}
      className="group flex flex-col rounded-lg overflow-hidden border border-border/50 bg-card/30 transition-all hover:border-border hover:shadow-md"
    >
      {/* Image */}
      <div className="relative aspect-square bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={game.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, (max-width: 1024px) 25vw, 16vw"
            className="object-cover transition-transform group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/50" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-2">
        <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
          {game.name}
        </p>
      </div>
    </Link>
  )
}
