import Link from 'next/link'
import { Home, Search, ArrowLeft } from 'lucide-react'

import { Button } from '@/components/ui/button'

export default function NotFound() {
  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      {/* Large 404 */}
      <div className="relative mb-8">
        <span className="text-[12rem] font-bold leading-none text-muted/20 select-none">
          404
        </span>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-6xl">🎲</div>
        </div>
      </div>

      {/* Message */}
      <h1 className="text-3xl font-bold tracking-tight mb-3">
        Page Not Found
      </h1>
      <p className="text-muted-foreground text-lg max-w-md mb-8">
        Looks like this game piece went missing! The page you&apos;re looking for
        doesn&apos;t exist or has been moved.
      </p>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Button asChild size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/games">
            <Search className="mr-2 h-4 w-4" />
            Browse Games
          </Link>
        </Button>
      </div>

      {/* Back link */}
      <Button
        asChild
        variant="ghost"
        className="mt-8 text-muted-foreground"
      >
        <Link href="javascript:history.back()">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Go Back
        </Link>
      </Button>
    </div>
  )
}
