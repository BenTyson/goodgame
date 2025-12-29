'use client'

import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface WizardContainerProps {
  children: React.ReactNode
  progress?: number // 0-100, undefined to hide
  showBack?: boolean
  onBack?: () => void
}

export function WizardContainer({
  children,
  progress,
  showBack = false,
  onBack,
}: WizardContainerProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
      {/* Progress bar and back button */}
      {(progress !== undefined || showBack) && (
        <div className="sticky top-16 z-40 bg-background/80 backdrop-blur-sm border-b">
          <div className="container">
            {/* Back button row */}
            {showBack && onBack && (
              <div className="py-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBack}
                  className="gap-2 -ml-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {progress !== undefined && (
            <div className="h-1 bg-muted">
              <div
                className={cn(
                  'h-full bg-primary transition-all duration-500 ease-out'
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      <main className="container py-8 md:py-12">
        <div className="mx-auto max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  )
}
