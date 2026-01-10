'use client'

import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MediaModalProps {
  /** Whether the modal is open */
  isOpen: boolean
  /** Current index (1-based display) */
  currentIndex: number
  /** Total number of items */
  totalItems: number
  /** Close handler */
  onClose: () => void
  /** Previous item handler */
  onPrevious: () => void
  /** Next item handler */
  onNext: () => void
  /** Aria label for the modal */
  ariaLabel: string
  /** Optional extra info to show in top bar */
  topBarExtra?: React.ReactNode
  /** Content to display in the modal */
  children: React.ReactNode
  /** Optional caption below the content */
  caption?: React.ReactNode
  /** Optional bottom content (e.g., thumbnail strip) */
  bottomContent?: React.ReactNode
}

/**
 * Shared modal shell for media galleries (images, videos)
 * Provides backdrop, navigation, close button, and counter
 */
export function MediaModal({
  isOpen,
  currentIndex,
  totalItems,
  onClose,
  onPrevious,
  onNext,
  ariaLabel,
  topBarExtra,
  children,
  caption,
  bottomContent,
}: MediaModalProps) {
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/95 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Content container */}
      <div className="relative z-10 flex h-full w-full flex-col items-center justify-center p-4 md:p-8">
        {/* Top bar */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-4 md:p-6">
          {/* Counter and extra info */}
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-white/90">
              {currentIndex} / {totalItems}
            </span>
            {topBarExtra}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className={cn(
              'flex h-10 w-10 items-center justify-center rounded-full',
              'bg-white/10 text-white/90 backdrop-blur-sm',
              'transition-all duration-200 hover:bg-white/20 hover:scale-105',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
            )}
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Main content */}
        <div
          className="animate-in zoom-in-95 duration-200"
          onClick={(e) => e.stopPropagation()}
        >
          {children}
        </div>

        {/* Caption */}
        {caption && (
          <div className="mt-4 max-w-2xl text-center text-sm text-white/80 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {caption}
          </div>
        )}

        {/* Navigation arrows */}
        {totalItems > 1 && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onPrevious()
              }}
              className={cn(
                'absolute left-4 md:left-8 top-1/2 -translate-y-1/2',
                'flex h-12 w-12 items-center justify-center rounded-full',
                'bg-white/10 text-white/90 backdrop-blur-sm',
                'transition-all duration-200 hover:bg-white/20 hover:scale-105',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
              )}
              aria-label="Previous"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onNext()
              }}
              className={cn(
                'absolute right-4 md:right-8 top-1/2 -translate-y-1/2',
                'flex h-12 w-12 items-center justify-center rounded-full',
                'bg-white/10 text-white/90 backdrop-blur-sm',
                'transition-all duration-200 hover:bg-white/20 hover:scale-105',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50'
              )}
              aria-label="Next"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}

        {/* Bottom content */}
        {bottomContent}
      </div>
    </div>
  )
}
