'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { Home, RotateCcw, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log error to console (could send to error reporting service)
    console.error('Application error:', error)
  }, [error])

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-16 text-center">
      {/* Error icon */}
      <div className="mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-destructive/10">
        <AlertCircle className="h-12 w-12 text-destructive" />
      </div>

      {/* Message */}
      <h1 className="text-3xl font-bold tracking-tight mb-3">
        Something Went Wrong
      </h1>
      <p className="text-muted-foreground text-lg max-w-md mb-2">
        We encountered an unexpected error. Don&apos;t worry, your game night
        isn&apos;t ruined!
      </p>

      {/* Error details (development only) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mt-4 mb-6 max-w-lg rounded-lg bg-muted p-4 text-left">
          <p className="text-sm font-mono text-muted-foreground break-all">
            {error.message}
          </p>
          {error.digest && (
            <p className="mt-2 text-xs text-muted-foreground">
              Error ID: {error.digest}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3 mt-4">
        <Button onClick={reset} size="lg">
          <RotateCcw className="mr-2 h-4 w-4" />
          Try Again
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link href="/">
            <Home className="mr-2 h-4 w-4" />
            Back to Home
          </Link>
        </Button>
      </div>
    </div>
  )
}
