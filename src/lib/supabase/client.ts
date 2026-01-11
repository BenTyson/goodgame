import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

let client: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Only use singleton on client side
  if (typeof window !== 'undefined' && client) {
    return client
  }

  const newClient = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )

  // Only cache on client side
  if (typeof window !== 'undefined') {
    client = newClient
  }

  return newClient
}
