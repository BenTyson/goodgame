'use client'

import { cn } from '@/lib/utils'

interface D10DiceFlatProps {
  value: number // 1-10
  filled?: boolean
  hovered?: boolean
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizes = {
  sm: { dimension: 22, fontSize: 10, borderWidth: 1.5 },
  md: { dimension: 30, fontSize: 13, borderWidth: 2 },
  lg: { dimension: 38, fontSize: 16, borderWidth: 2 },
}

/**
 * Flat/Modern alternative to D10Dice
 * - Solid fills instead of gradients
 * - Subtle ring instead of 3D sphere
 * - Cleaner, more minimal aesthetic
 */
export function D10DiceFlat({
  value,
  filled = false,
  hovered = false,
  size = 'md',
  className,
}: D10DiceFlatProps) {
  const { dimension, fontSize, borderWidth } = sizes[size]

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all duration-200',
        // Base styles
        'font-bold tabular-nums select-none',
        // Filled state - solid primary
        filled && 'bg-primary text-primary-foreground shadow-sm',
        // Hovered state - subtle fill
        !filled && hovered && 'bg-primary/15 text-primary border-primary/50',
        // Empty state - just border
        !filled && !hovered && 'bg-transparent text-muted-foreground border-muted-foreground/30',
        // Border for non-filled
        !filled && 'border',
        className
      )}
      style={{
        width: dimension,
        height: dimension,
        fontSize,
        borderWidth: !filled ? borderWidth : 0,
      }}
    >
      {value}
    </div>
  )
}

/**
 * Even flatter - just a number with underline/dot indicator
 */
export function D10DiceMinimal({
  value,
  filled = false,
  hovered = false,
  size = 'md',
  className,
}: D10DiceFlatProps) {
  const fontSizes = { sm: 'text-sm', md: 'text-base', lg: 'text-lg' }

  return (
    <div
      className={cn(
        'inline-flex flex-col items-center transition-all duration-200',
        fontSizes[size],
        className
      )}
    >
      <span
        className={cn(
          'font-bold tabular-nums transition-colors',
          filled && 'text-primary',
          !filled && hovered && 'text-primary/70',
          !filled && !hovered && 'text-muted-foreground/50',
        )}
      >
        {value}
      </span>
      {/* Dot indicator */}
      <div
        className={cn(
          'h-1 w-1 rounded-full mt-0.5 transition-all duration-200',
          filled && 'bg-primary scale-100',
          !filled && hovered && 'bg-primary/50 scale-100',
          !filled && !hovered && 'bg-transparent scale-0',
        )}
      />
    </div>
  )
}

/**
 * Soft/Neumorphic - subtle depth without glossy 3D
 */
export function D10DiceSoft({
  value,
  filled = false,
  hovered = false,
  size = 'md',
  className,
}: D10DiceFlatProps) {
  const { dimension, fontSize } = sizes[size]

  return (
    <div
      className={cn(
        'inline-flex items-center justify-center rounded-full transition-all duration-200',
        'font-bold tabular-nums select-none',
        // Filled - solid with subtle shadow
        filled && [
          'bg-primary text-primary-foreground',
          'shadow-[0_2px_8px_-2px_rgba(0,0,0,0.2),inset_0_1px_0_rgba(255,255,255,0.1)]',
        ],
        // Hovered - soft inset
        !filled && hovered && [
          'bg-primary/10 text-primary',
          'shadow-[inset_0_1px_2px_rgba(0,0,0,0.05)]',
        ],
        // Empty - very subtle
        !filled && !hovered && [
          'bg-muted/50 text-muted-foreground',
        ],
        className
      )}
      style={{
        width: dimension,
        height: dimension,
        fontSize,
      }}
    >
      {value}
    </div>
  )
}
