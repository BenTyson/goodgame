'use client'

import { useState } from 'react'
import { Mail, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'

export default function ComingSoonPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/coming-soon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong')
      }

      setSubmitted(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Radial gradient overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, rgba(20, 184, 166, 0.15) 0%, transparent 70%)',
        }}
      />

      {/* Main content */}
      <div className="relative flex-1 flex items-center justify-center p-6">
        <div className="w-full max-w-md text-center">
          {/* Brand */}
          <h1 className="text-4xl font-bold tracking-[0.3em] uppercase mb-3">
            Boardmello
          </h1>

          {/* Tagline */}
          <p className="text-xl text-muted-foreground mb-10">
            Probably the best thing ever.
          </p>

          {/* Signup card */}
          <Card className="shadow-lg border-muted/50">
            <CardContent className="pt-6 pb-6">
              {submitted ? (
                <p className="py-4 text-muted-foreground">
                  Thank you, friend. We will be in touch.
                </p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">
                    You should join our Beta Group. Trust us.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-3">
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 h-11"
                        required
                      />
                    </div>

                    {error && (
                      <p className="text-sm text-destructive">{error}</p>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-11"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Signing up...
                        </>
                      ) : (
                        'Make a Good Decision'
                      )}
                    </Button>
                  </form>
                </>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <p className="mt-8 text-sm text-muted-foreground max-w-sm mx-auto">
            The greatest Board Game hub in the history of the known (and possibly unknown) universe.
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer className="py-6 text-center">
        <p className="text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} Boardmello. All rights reserved.
        </p>
      </footer>
    </div>
  )
}
