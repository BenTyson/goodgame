import { Metadata } from 'next'
import { getFamiliesWithGameCounts } from '@/lib/supabase/queries'
import { FamilyCard } from '@/components/families'

export const metadata: Metadata = {
  title: 'Game Families',
  description: 'Browse board game families - related games, sequels, expansions, and editions.',
}

export default async function FamiliesPage() {
  const families = await getFamiliesWithGameCounts()

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Game Families
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse related games, sequels, expansions, and different editions
        </p>
      </div>

      {families.length === 0 ? (
        <p className="text-muted-foreground">No game families found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {families.map((family) => (
            <FamilyCard key={family.id} family={family} />
          ))}
        </div>
      )}
    </div>
  )
}
