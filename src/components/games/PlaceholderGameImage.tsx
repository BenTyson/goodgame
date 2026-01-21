'use client'

import { cn } from '@/lib/utils'

interface PlaceholderGameImageProps {
  gameName: string
  gameId: string
  className?: string
}

// Color palettes for variety - each game gets a consistent color based on ID
const COLOR_PALETTES = [
  { bg: 'from-teal-600 to-teal-800', accent: 'text-teal-300', muted: 'text-teal-400/30' },
  { bg: 'from-indigo-600 to-indigo-800', accent: 'text-indigo-300', muted: 'text-indigo-400/30' },
  { bg: 'from-violet-600 to-violet-800', accent: 'text-violet-300', muted: 'text-violet-400/30' },
  { bg: 'from-blue-600 to-blue-800', accent: 'text-blue-300', muted: 'text-blue-400/30' },
  { bg: 'from-emerald-600 to-emerald-800', accent: 'text-emerald-300', muted: 'text-emerald-400/30' },
  { bg: 'from-cyan-600 to-cyan-800', accent: 'text-cyan-300', muted: 'text-cyan-400/30' },
  { bg: 'from-rose-600 to-rose-800', accent: 'text-rose-300', muted: 'text-rose-400/30' },
  { bg: 'from-amber-600 to-amber-800', accent: 'text-amber-300', muted: 'text-amber-400/30' },
]

// Simple hash function to get consistent color for each game
function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  return Math.abs(hash)
}

export function PlaceholderGameImage({ gameName, gameId, className }: PlaceholderGameImageProps) {
  const paletteIndex = hashString(gameId) % COLOR_PALETTES.length
  const palette = COLOR_PALETTES[paletteIndex]

  // Get initials (up to 2 characters)
  const initials = gameName
    .split(/\s+/)
    .filter(word => word.length > 0)
    .slice(0, 2)
    .map(word => word[0].toUpperCase())
    .join('')

  return (
    <div
      className={cn(
        'relative w-full h-full bg-gradient-to-br overflow-hidden',
        palette.bg,
        className
      )}
    >
      {/* Decorative background elements */}
      <div className="absolute inset-0 flex items-center justify-center">
        {/* Large decorative dice in background */}
        <svg
          viewBox="0 0 200 200"
          className={cn('absolute w-3/4 h-3/4 opacity-10', palette.muted)}
          style={{ transform: 'rotate(-12deg)' }}
        >
          {/* Die outline */}
          <rect
            x="30"
            y="30"
            width="140"
            height="140"
            rx="20"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
          />
          {/* Die pips pattern (6-side) */}
          <circle cx="60" cy="60" r="10" fill="currentColor" />
          <circle cx="100" cy="60" r="10" fill="currentColor" />
          <circle cx="140" cy="60" r="10" fill="currentColor" />
          <circle cx="60" cy="140" r="10" fill="currentColor" />
          <circle cx="100" cy="140" r="10" fill="currentColor" />
          <circle cx="140" cy="140" r="10" fill="currentColor" />
        </svg>

        {/* Small meeple silhouettes */}
        <svg
          viewBox="0 0 100 100"
          className={cn('absolute w-1/4 h-1/4 opacity-10 top-4 right-4', palette.muted)}
        >
          {/* Meeple shape */}
          <path
            d="M50 15 C50 15 35 25 35 35 C35 42 40 45 40 50 L25 85 L45 85 L50 70 L55 85 L75 85 L60 50 C60 45 65 42 65 35 C65 25 50 15 50 15 Z"
            fill="currentColor"
          />
        </svg>

        <svg
          viewBox="0 0 100 100"
          className={cn('absolute w-1/5 h-1/5 opacity-10 bottom-6 left-6', palette.muted)}
          style={{ transform: 'rotate(15deg)' }}
        >
          {/* Meeple shape */}
          <path
            d="M50 15 C50 15 35 25 35 35 C35 42 40 45 40 50 L25 85 L45 85 L50 70 L55 85 L75 85 L60 50 C60 45 65 42 65 35 C65 25 50 15 50 15 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      {/* Main content */}
      <div className="relative h-full flex flex-col items-center justify-center p-4 text-center">
        {/* Large initials circle */}
        <div className="mb-3 w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/20">
          <span className={cn('text-3xl font-bold', palette.accent)}>
            {initials || '?'}
          </span>
        </div>

        {/* Game name */}
        <h3 className="text-white font-semibold text-sm md:text-base leading-tight line-clamp-2 max-w-[90%] drop-shadow-md">
          {gameName}
        </h3>

        {/* Preview indicator */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center">
          <span className="text-[10px] uppercase tracking-wider text-white/50 font-medium">
            Image Coming Soon
          </span>
        </div>
      </div>
    </div>
  )
}
