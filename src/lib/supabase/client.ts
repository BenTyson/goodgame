import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

/**
 * Creates a Supabase client for browser-side use.
 *
 * Uses @supabase/ssr's createBrowserClient which:
 * - Stores session in cookies (matching server/middleware)
 * - Manages its own internal state (no singleton needed)
 * - Automatically syncs with server-side session refreshes
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
