'use client'

import {
  Brain,
  Users,
  Handshake,
  BookOpen,
  Zap,
  Gem,
  Star,
} from 'lucide-react'
import type { Archetype, ArchetypeId } from '@/lib/recommend/types'
import { cn } from '@/lib/utils'

// Map archetype icons to components
const ARCHETYPE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Brain,
  Users,
  Handshake,
  BookOpen,
  Zap,
  Gem,
  Star,
}

interface ArchetypeRevealProps {
  archetype: Archetype
}

export function ArchetypeReveal({ archetype }: ArchetypeRevealProps) {
  const IconComponent = ARCHETYPE_ICONS[archetype.icon] || Star

  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
      {/* Animated container */}
      <div className="animate-in zoom-in-50 duration-500">
        {/* Icon with glow effect */}
        <div className="relative mb-6">
          <div
            className={cn(
              'absolute inset-0 rounded-full blur-2xl opacity-50 animate-pulse',
              archetype.color || 'bg-primary'
            )}
          />
          <div
            className={cn(
              'relative p-6 rounded-full',
              archetype.color || 'bg-primary/10'
            )}
          >
            <IconComponent className={cn('h-16 w-16', archetype.color ? 'text-white' : 'text-primary')} />
          </div>
        </div>

        {/* "You are" label */}
        <p className="text-sm uppercase tracking-widest text-muted-foreground animate-in fade-in duration-300 delay-200">
          You are
        </p>

        {/* Archetype name */}
        <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300">
          {archetype.name}
        </h2>

        {/* Description */}
        <p className="mt-4 text-lg text-muted-foreground max-w-md animate-in fade-in slide-in-from-bottom-4 duration-500 delay-500">
          {archetype.description}
        </p>
      </div>

      {/* Loading indicator for next step */}
      <div className="mt-10 animate-in fade-in duration-500 delay-1000">
        <p className="text-sm text-muted-foreground">
          Finding your perfect games...
        </p>
      </div>
    </div>
  )
}
