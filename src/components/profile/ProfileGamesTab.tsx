'use client'

import { ProfileShelfGrid } from './ProfileShelfGrid'
import type { Game } from '@/types/database'

interface ShelfGame {
  id: string
  status: string
  rating: number | null
  game: Pick<Game, 'id' | 'name' | 'slug' | 'box_image_url'> | null
}

interface ShelfStats {
  total: number
  owned: number
  want_to_buy: number
  want_to_play: number
  wishlist: number
  previously_owned: number
}

interface ProfileGamesTabProps {
  shelfData: ShelfGame[] | null
  shelfStats: ShelfStats | null
  isOwnProfile: boolean
  showShelf: boolean
}

export function ProfileGamesTab({
  shelfData,
  shelfStats,
  isOwnProfile,
  showShelf,
}: ProfileGamesTabProps) {
  return (
    <ProfileShelfGrid
      shelfData={shelfData}
      shelfStats={shelfStats}
      isOwnProfile={isOwnProfile}
      showShelf={showShelf}
      mode="full"
    />
  )
}
