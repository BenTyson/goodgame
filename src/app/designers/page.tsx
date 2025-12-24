import { Metadata } from 'next'
import Link from 'next/link'
import { getDesigners } from '@/lib/supabase/queries'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Board Game Designers',
  description: 'Browse board games by designer. Find games from your favorite game designers.',
}

export default async function DesignersPage() {
  const designers = await getDesigners()

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Board Game Designers
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse board games by designer
        </p>
      </div>

      {designers.length === 0 ? (
        <p className="text-muted-foreground">No designers found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {designers.map((designer) => (
            <Link key={designer.id} href={`/designers/${designer.slug}`}>
              <Card className="h-full transition-colors hover:bg-accent">
                <CardContent className="p-4">
                  <h2 className="font-medium">{designer.name}</h2>
                  {designer.bio && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {designer.bio}
                    </p>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
