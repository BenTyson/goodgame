import { Metadata } from 'next'
import { getPublishersWithGameCounts } from '@/lib/supabase/queries'
import { PublishersList } from './PublishersList'

export const metadata: Metadata = {
  title: 'Board Game Publishers',
  description: 'Browse board games by publisher. Find games from your favorite game publishers.',
}

export default async function PublishersPage() {
  const publishers = await getPublishersWithGameCounts()

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Board Game Publishers
        </h1>
        <p className="mt-2 text-muted-foreground">
          Discover games from leading board game publishers
        </p>
      </div>

      <PublishersList publishers={publishers} />
    </div>
  )
}
