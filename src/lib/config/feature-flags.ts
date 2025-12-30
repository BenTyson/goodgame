/**
 * Feature Flags Utility
 *
 * Provides functions for checking feature flag status.
 * Supports both global flags and user-specific beta access.
 */

import { createClient } from '@/lib/supabase/client'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { FeatureFlag, MarketplaceFeatureFlag } from '@/types/marketplace'
import { FEATURE_FLAG_KEYS } from './marketplace-constants'

// Cache for feature flags (client-side only)
let flagCache: Map<string, FeatureFlag> | null = null
let cacheTimestamp: number = 0
const CACHE_TTL_MS = 60 * 1000 // 1 minute cache

/**
 * Get all feature flags from the database
 *
 * NOTE: Uses type casting until database types are regenerated after migrations.
 */
export async function getFeatureFlags(): Promise<FeatureFlag[]> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('feature_flags')
    .select('*')

  if (error) {
    console.error('Error fetching feature flags:', error)
    return []
  }

  return (data || []) as FeatureFlag[]
}

/**
 * Get a specific feature flag by key
 *
 * NOTE: Uses type casting until database types are regenerated after migrations.
 */
export async function getFeatureFlag(
  flagKey: string
): Promise<FeatureFlag | null> {
  // Check cache first (client-side)
  if (typeof window !== 'undefined' && flagCache && Date.now() - cacheTimestamp < CACHE_TTL_MS) {
    const cached = flagCache.get(flagKey)
    if (cached) return cached
  }

  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('feature_flags')
    .select('*')
    .eq('flag_key', flagKey)
    .maybeSingle()

  if (error) {
    console.error('Error fetching feature flag:', error)
    return null
  }

  // Update cache
  if (typeof window !== 'undefined' && data) {
    if (!flagCache) flagCache = new Map()
    flagCache.set(flagKey, data as FeatureFlag)
    cacheTimestamp = Date.now()
  }

  return data as FeatureFlag | null
}

/**
 * Check if a feature flag is enabled
 *
 * @param flagKey - The feature flag key to check
 * @param userId - Optional user ID for beta access check
 * @returns true if the feature is enabled for this user
 */
export async function isFeatureEnabled(
  flagKey: MarketplaceFeatureFlag | string,
  userId?: string
): Promise<boolean> {
  const flag = await getFeatureFlag(flagKey)

  if (!flag) {
    // Flag doesn't exist - default to disabled
    return false
  }

  // If globally enabled, allow access
  if (flag.is_enabled) {
    return true
  }

  // If user is in beta list, allow access
  if (userId && flag.allowed_user_ids.includes(userId)) {
    return true
  }

  return false
}

/**
 * Check if the marketplace is accessible for a user
 *
 * Checks both the master marketplace_enabled flag and beta access.
 */
export async function hasMarketplaceAccess(userId?: string): Promise<boolean> {
  // Check master flag first
  const masterEnabled = await isFeatureEnabled(
    FEATURE_FLAG_KEYS.MARKETPLACE_ENABLED,
    userId
  )

  if (masterEnabled) {
    return true
  }

  // Check beta access if user is logged in
  if (userId) {
    const betaEnabled = await isFeatureEnabled(
      FEATURE_FLAG_KEYS.MARKETPLACE_BETA,
      userId
    )
    return betaEnabled
  }

  return false
}

/**
 * Server-side version of hasMarketplaceAccess
 * Uses server client for SSR contexts
 *
 * NOTE: Uses type casting until database types are regenerated after migrations.
 */
export async function hasMarketplaceAccessServer(
  userId?: string
): Promise<boolean> {
  const supabase = await createServerClient()

  // Check master flag
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: masterFlag } = await (supabase as any)
    .from('feature_flags')
    .select('*')
    .eq('flag_key', FEATURE_FLAG_KEYS.MARKETPLACE_ENABLED)
    .maybeSingle()

  if (masterFlag?.is_enabled) {
    return true
  }

  // Check if user is in beta list
  if (userId && masterFlag?.allowed_user_ids?.includes(userId)) {
    return true
  }

  // Check beta access flag
  if (userId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: betaFlag } = await (supabase as any)
      .from('feature_flags')
      .select('*')
      .eq('flag_key', FEATURE_FLAG_KEYS.MARKETPLACE_BETA)
      .maybeSingle()

    if (betaFlag?.is_enabled || betaFlag?.allowed_user_ids?.includes(userId)) {
      return true
    }
  }

  return false
}

/**
 * Clear the feature flag cache (client-side)
 * Call this when you know flags have changed
 */
export function clearFeatureFlagCache(): void {
  flagCache = null
  cacheTimestamp = 0
}

/**
 * Add a user to a feature flag's beta list
 * (Admin only - requires service role)
 *
 * NOTE: Uses type casting until database types are regenerated after migrations.
 */
export async function addUserToBeta(
  flagKey: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: flag, error: fetchError } = await (supabase as any)
    .from('feature_flags')
    .select('allowed_user_ids')
    .eq('flag_key', flagKey)
    .single()

  if (fetchError || !flag) {
    console.error('Error fetching flag for beta add:', fetchError)
    return false
  }

  const existingUsers = flag.allowed_user_ids || []
  if (existingUsers.includes(userId)) {
    // Already in list
    return true
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('feature_flags')
    .update({
      allowed_user_ids: [...existingUsers, userId],
      updated_at: new Date().toISOString(),
    })
    .eq('flag_key', flagKey)

  if (updateError) {
    console.error('Error adding user to beta:', updateError)
    return false
  }

  clearFeatureFlagCache()
  return true
}

/**
 * Remove a user from a feature flag's beta list
 * (Admin only - requires service role)
 *
 * NOTE: Uses type casting until database types are regenerated after migrations.
 */
export async function removeUserFromBeta(
  flagKey: string,
  userId: string
): Promise<boolean> {
  const supabase = createClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: flag, error: fetchError } = await (supabase as any)
    .from('feature_flags')
    .select('allowed_user_ids')
    .eq('flag_key', flagKey)
    .single()

  if (fetchError || !flag) {
    console.error('Error fetching flag for beta remove:', fetchError)
    return false
  }

  const existingUsers = flag.allowed_user_ids || []
  const updatedUsers = existingUsers.filter((id: string) => id !== userId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from('feature_flags')
    .update({
      allowed_user_ids: updatedUsers,
      updated_at: new Date().toISOString(),
    })
    .eq('flag_key', flagKey)

  if (updateError) {
    console.error('Error removing user from beta:', updateError)
    return false
  }

  clearFeatureFlagCache()
  return true
}
