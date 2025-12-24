import { Metadata } from 'next'
import Link from 'next/link'
import { getPublishers } from '@/lib/supabase/queries'
import { Card, CardContent } from '@/components/ui/card'

export const metadata: Metadata = {
  title: 'Board Game Publishers',
  description: 'Browse board games by publisher. Find games from your favorite game publishers.',
}

export default async function PublishersPage() {
  const publishers = await getPublishers()

  return (
    <div className="container py-8 md:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          Board Game Publishers
        </h1>
        <p className="mt-2 text-muted-foreground">
          Browse board games by publisher
        </p>
      </div>

      {publishers.length === 0 ? (
        <p className="text-muted-foreground">No publishers found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {publishers.map((publisher) => (
            <Link key={publisher.id} href={`/publishers/${publisher.slug}`}>
              <Card className="h-full transition-colors hover:bg-accent">
                <CardContent className="p-4">
                  <h2 className="font-medium">{publisher.name}</h2>
                  {publisher.description && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {publisher.description}
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
