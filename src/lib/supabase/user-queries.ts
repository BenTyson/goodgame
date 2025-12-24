/**
 * User Shelf Queries
 * Client-side queries for authenticated user shelf operations
 */

import { createClient } from './client'
import type {
  UserGame,
  UserGameInsert,
  UserGameUpdate,
  UserGameWithGame,
  ShelfStatus,
  UserProfile,
  UserProfileUpdate,
} from '@/types/database'

// =====================================================
// USER SHELF QUERIES
// =====================================================

export async function getUserShelf(
  userId: string,
  options?: {
    status?: ShelfStatus
    sortBy?: 'name' | 'rating' | 'added' | 'status'
    sortOrder?: 'asc' | 'desc'
  }
): Promise<UserGameWithGame[]> {
  const supabase = createClient()

  let query = supabase
    .from('user_games')
    .select(`
      *,
      game:games(*)
    `)
    .eq('user_id', userId)

  if (options?.status) {
    query = query.eq('status', options.status)
  }

  // Apply sorting
  const sortBy = options?.sortBy || 'added'
  const ascending = options?.sortOrder !== 'desc'

  switch (sortBy) {
    case 'name':
      // Sort by game name requires different approach - sort client-side
      query = query.order('created_at', { ascending: false })
      break
    case 'rating':
      query = query.order('rating', { ascending, nullsFirst: false })
      break
    case 'status':
      query = query.order('status', { ascending })
      break
    case 'added':
    default:
      query = query.order('created_at', { ascending })
  }

  const { data, error } = await query

  if (error) throw error

  // If sorting by name, do it client-side
  if (sortBy === 'name' && data) {
    return data.sort((a, b) => {
      const nameA = a.game?.name || ''
      const nameB = b.game?.name || ''
      return ascending
        ? nameA.localeCompare(nameB)
        : nameB.localeCompare(nameA)
    }) as UserGameWithGame[]
  }

  return (data || []) as UserGameWithGame[]
}

export async function getUserGameStatus(
  userId: string,
  gameId: string
): Promise<UserGame | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_games')
    .select('*')
    .eq('user_id', userId)
    .eq('game_id', gameId)
    .maybeSingle()

  if (error) throw error
  return data
}

export async function addToShelf(data: UserGameInsert): Promise<UserGame> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('user_games')
    .upsert(data, { onConflict: 'user_id,game_id' })
    .select()
    .single()

  if (error) throw error
  return result
}

export async function updateShelfItem(
  id: string,
  data: UserGameUpdate
): Promise<UserGame> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('user_games')
    .update(data)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return result
}

export async function removeFromShelf(id: string): Promise<void> {
  const supabase = createClient()

  const { error } = await supabase
    .from('user_games')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getShelfStats(userId: string): Promise<{
  total: number
  owned: number
  want_to_buy: number
  want_to_play: number
  wishlist: number
  previously_owned: number
}> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_games')
    .select('status')
    .eq('user_id', userId)

  if (error) throw error

  const stats = {
    total: data?.length || 0,
    owned: data?.filter(g => g.status === 'owned').length || 0,
    want_to_buy: data?.filter(g => g.status === 'want_to_buy').length || 0,
    want_to_play: data?.filter(g => g.status === 'want_to_play').length || 0,
    wishlist: data?.filter(g => g.status === 'wishlist').length || 0,
    previously_owned: data?.filter(g => g.status === 'previously_owned').length || 0,
  }

  return stats
}

// =====================================================
// USER PROFILE QUERIES
// =====================================================

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error && error.code !== 'PGRST116') throw error
  return data
}

export async function updateUserProfile(
  userId: string,
  data: UserProfileUpdate
): Promise<UserProfile> {
  const supabase = createClient()

  const { data: result, error } = await supabase
    .from('user_profiles')
    .update(data)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return result
}
