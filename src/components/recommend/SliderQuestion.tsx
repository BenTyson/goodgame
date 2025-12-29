'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'

interface SliderOption {
  id: string
  label: string
  description?: string
}

interface SliderQuestionProps {
  title: string
  subtitle?: string
  value: string
  options: SliderOption[]
  onSelect: (id: string) => void
}

export function SliderQuestion({
  title,
  subtitle,
  value,
  options,
  onSelect,
}: SliderQuestionProps) {
  // Local state for selection before committing
  const [localValue, setLocalValue] = useState(value)
  const selectedIndex = options.findIndex((opt) => opt.id === localValue)

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

      {/* Selected value display */}
      <div className="text-center mb-8">
        <div className="inline-flex flex-col items-center px-6 py-4 rounded-xl bg-primary/10">
          <span className="text-2xl font-bold text-primary">
            {options[selectedIndex]?.label}
          </span>
          <span className="text-sm text-muted-foreground">
            {options[selectedIndex]?.description}
          </span>
        </div>
      </div>

      {/* Slider track */}
      <div className="px-4">
        <div className="relative">
          {/* Track background */}
          <div className="h-2 bg-muted rounded-full" />

          {/* Active track */}
          <div
            className="absolute top-0 left-0 h-2 bg-primary rounded-full transition-all duration-200"
            style={{ width: `${(selectedIndex / (options.length - 1)) * 100}%` }}
          />

          {/* Option markers */}
          <div className="absolute top-0 left-0 right-0 flex justify-between">
            {options.map((option, index) => {
              const isActive = index <= selectedIndex
              const isSelected = index === selectedIndex

              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setLocalValue(option.id)}
                  className={cn(
                    'relative -mt-1 w-4 h-4 rounded-full border-2 transition-all duration-200',
                    'hover:scale-110 focus:outline-none focus:ring-2 focus:ring-primary/50',
                    isActive
                      ? 'bg-primary border-primary'
                      : 'bg-background border-muted-foreground/30',
                    isSelected && 'ring-4 ring-primary/20 scale-125'
                  )}
                  aria-label={option.label}
                />
              )
            })}
          </div>
        </div>

        {/* Labels */}
        <div className="flex justify-between mt-4">
          {options.map((option, index) => (
            <button
              key={option.id}
              type="button"
              onClick={() => setLocalValue(option.id)}
              className={cn(
                'text-xs text-center transition-colors hover:text-primary',
                index === selectedIndex
                  ? 'text-primary font-medium'
                  : 'text-muted-foreground'
              )}
              style={{
                width: `${100 / options.length}%`,
              }}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Continue button */}
      <div className="mt-10 text-center">
        <button
          onClick={() => onSelect(localValue)}
          className="inline-flex items-center justify-center rounded-lg bg-primary px-8 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          Continue
        </button>
      </div>
    </div>
  )
}
