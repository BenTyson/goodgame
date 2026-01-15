import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getUserSavedSearches } from '@/lib/supabase/discovery-queries'
import { SavedSearchesClient } from './SavedSearchesClient'

export const metadata: Metadata = {
  title: 'Saved Searches | Boardmello Marketplace',
  description: 'Manage your saved marketplace searches and alerts.',
}

export default async function SavedSearchesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/marketplace/saved-searches')
  }

  const savedSearches = await getUserSavedSearches(user.id)

  return <SavedSearchesClient initialSearches={savedSearches} />
}
