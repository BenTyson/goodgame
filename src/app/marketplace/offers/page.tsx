import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getOffersByUser, getPendingOfferCount } from '@/lib/supabase/offer-queries'
import { OffersPageClient } from './OffersPageClient'

export const metadata: Metadata = {
  title: 'My Offers | Board Nomads Marketplace',
  description: 'View and manage your marketplace offers',
}

export default async function OffersPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/marketplace/offers')
  }

  // Fetch initial data for both tabs
  const [receivedOffers, sentOffers, pendingReceivedCount, pendingSentCount] = await Promise.all([
    getOffersByUser(user.id, 'seller', { limit: 20, offset: 0 }),
    getOffersByUser(user.id, 'buyer', { limit: 20, offset: 0 }),
    getPendingOfferCount(user.id, 'seller'),
    getPendingOfferCount(user.id, 'buyer'),
  ])

  return (
    <OffersPageClient
      initialReceivedOffers={receivedOffers}
      initialSentOffers={sentOffers}
      pendingReceivedCount={pendingReceivedCount}
      pendingSentCount={pendingSentCount}
      userId={user.id}
    />
  )
}
