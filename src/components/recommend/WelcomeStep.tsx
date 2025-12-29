'use client'

import { Sparkles, ArrowRight, Clock, Target, Smile } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'

interface WelcomeStepProps {
  onStart: () => void
}

export function WelcomeStep({ onStart }: WelcomeStepProps) {
  return (
    <div className="flex flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Icon */}
      <div className="mb-6 p-4 rounded-2xl bg-primary/10">
        <Sparkles className="h-12 w-12 text-primary" />
      </div>

      {/* Headline */}
      <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
        Find Your Perfect Game
      </h1>
      <p className="mt-4 text-lg text-muted-foreground max-w-md">
        Answer a few quick questions and we will match you with board games you will love.
      </p>

      {/* Features */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3 w-full max-w-lg">
        <Card depth="flat" padding="sm" className="border-0 bg-muted/50">
          <CardContent className="flex flex-col items-center text-center p-4">
            <Clock className="h-5 w-5 text-primary mb-2" />
            <span className="text-sm font-medium">Under 2 min</span>
          </CardContent>
        </Card>
        <Card depth="flat" padding="sm" className="border-0 bg-muted/50">
          <CardContent className="flex flex-col items-center text-center p-4">
            <Target className="h-5 w-5 text-primary mb-2" />
            <span className="text-sm font-medium">Personalized</span>
          </CardContent>
        </Card>
        <Card depth="flat" padding="sm" className="border-0 bg-muted/50">
          <CardContent className="flex flex-col items-center text-center p-4">
            <Smile className="h-5 w-5 text-primary mb-2" />
            <span className="text-sm font-medium">Fun quiz</span>
          </CardContent>
        </Card>
      </div>

      {/* CTA */}
      <Button
        size="lg"
        className="mt-10 gap-2 group"
        onClick={onStart}
      >
        Let&apos;s Go
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
      </Button>

      {/* Skip link */}
      <p className="mt-6 text-sm text-muted-foreground">
        Already know what you want?{' '}
        <a href="/games" className="text-primary hover:underline">
          Browse all games
        </a>
      </p>
    </div>
  )
}
