import { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import { DiscoverContent } from './DiscoverContent'

export const metadata: Metadata = {
  title: 'Discover Tables | Boardmello',
  description: 'Find game tables near you and join local board game meetups.',
}

export default async function DiscoverTablesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return <DiscoverContent userId={user?.id} />
}
