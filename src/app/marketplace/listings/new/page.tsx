import { redirect } from 'next/navigation'
import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

import { createClient } from '@/lib/supabase/server'
import { CreateListingWizard } from '@/components/marketplace'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Create Listing',
}

export default async function CreateListingPage() {
  const supabase = await createClient()

  // Get current user
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/marketplace/listings/new')
  }

  // Get user's owned games
  const { data: userGames } = await supabase
    .from('user_games')
    .select(`
      game:games(
        id,
        name,
        slug,
        thumbnail_url,
        year_published
      )
    `)
    .eq('user_id', user.id)
    .in('shelf_status', ['owned', 'for_trade'])
    .order('created_at', { ascending: false })

  // Get user's marketplace settings for default location
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings } = await (supabase as any)
    .from('user_marketplace_settings')
    .select('default_location_city, default_location_state')
    .eq('user_id', user.id)
    .maybeSingle()

  const ownedGames = (userGames || [])
    .filter((ug) => ug.game)
    .map((ug) => ({
      id: ug.game.id,
      name: ug.game.name,
      slug: ug.game.slug,
      thumbnail_url: ug.game.thumbnail_url,
      year_published: ug.game.year_published,
    }))

  return (
    <div className="max-w-[1600px] mx-auto px-4 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" asChild className="mb-4 -ml-3">
          <Link href="/marketplace">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Marketplace
          </Link>
        </Button>
        <h1 className="text-3xl font-bold tracking-tight">Create Listing</h1>
        <p className="mt-2 text-muted-foreground">
          List a game for sale, trade, or find one you're looking for.
        </p>
      </div>

      {/* Wizard */}
      <CreateListingWizard
        ownedGames={ownedGames}
        defaultLocationCity={settings?.default_location_city || ''}
        defaultLocationState={settings?.default_location_state || ''}
      />
    </div>
  )
}
