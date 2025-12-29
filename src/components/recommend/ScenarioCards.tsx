'use client'

import {
  User,
  Users,
  Sparkles,
  Coffee,
  BookOpen,
  Brain,
  Swords,
  Handshake,
  Target,
  PartyPopper,
  Check,
} from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

// Map icon names to components
const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  User,
  Users,
  Sparkles,
  Coffee,
  BookOpen,
  Brain,
  Swords,
  Handshake,
  Target,
  PartyPopper,
}

interface ScenarioOption {
  id: string
  label: string
  description?: string
  icon?: string
}

interface ScenarioCardsProps {
  title: string
  subtitle?: string
  options: ScenarioOption[]
  selectedId?: string
  onSelect: (id: string) => void
}

export function ScenarioCards({
  title,
  subtitle,
  options,
  selectedId,
  onSelect,
}: ScenarioCardsProps) {
  return (
    <div className="animate-in fade-in slide-in-from-right-4 duration-300">
      {/* Question header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight md:text-3xl">
          {title}
        </h2>
        {subtitle && (
          <p className="mt-2 text-muted-foreground">
            {subtitle}
          </p>
        )}
      </div>

      {/* Options grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {options.map((option) => {
          const isSelected = selectedId === option.id
          const IconComponent = option.icon ? ICONS[option.icon] : null

          return (
            <Card
              key={option.id}
              interactive
              depth={isSelected ? 'raised' : 'subtle'}
              padding="none"
              className={cn(
                'cursor-pointer transition-all duration-200',
                isSelected && 'ring-2 ring-primary border-primary/50'
              )}
              onClick={() => onSelect(option.id)}
            >
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  {IconComponent && (
                    <div
                      className={cn(
                        'flex-shrink-0 p-2 rounded-lg transition-colors',
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      )}
                    >
                      <IconComponent className="h-5 w-5" />
                    </div>
                  )}

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold">{option.label}</h3>
                    {option.description && (
                      <p className="mt-1 text-sm text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>

                  {/* Selection indicator */}
                  <div
                    className={cn(
                      'flex-shrink-0 w-5 h-5 rounded-full border-2 transition-all',
                      isSelected
                        ? 'border-primary bg-primary'
                        : 'border-muted-foreground/30'
                    )}
                  >
                    {isSelected && (
                      <Check className="h-full w-full text-primary-foreground p-0.5" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>
    </div>
  )
}
