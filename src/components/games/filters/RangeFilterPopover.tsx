'use client'

import * as React from 'react'
import { type LucideIcon } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'

interface RangeFilterPopoverProps {
  icon: LucideIcon
  label: string
  value: [number, number]
  defaultValue: [number, number]
  min: number
  max: number
  step: number
  formatValue: (min: number, max: number) => string
  onValueChange: (value: [number, number]) => void
  onValueCommit: (value: [number, number]) => void
  className?: string
}

export function RangeFilterPopover({
  icon: Icon,
  label,
  value,
  defaultValue,
  min,
  max,
  step,
  formatValue,
  onValueChange,
  onValueCommit,
  className,
}: RangeFilterPopoverProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [localValue, setLocalValue] = React.useState(value)
  const isDefault = value[0] === defaultValue[0] && value[1] === defaultValue[1]

  // Sync local state when prop changes
  React.useEffect(() => {
    setLocalValue(value)
  }, [value])

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open)
    // Commit value when closing
    if (!open && (localValue[0] !== value[0] || localValue[1] !== value[1])) {
      onValueCommit(localValue)
    }
  }

  const displayValue = formatValue(value[0], value[1])

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'h-9 gap-2 font-normal',
            !isDefault && 'border-primary/50 bg-primary/5',
            className
          )}
        >
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="hidden sm:inline">{label}:</span>
          <span className={cn(!isDefault && 'font-medium text-primary')}>
            {displayValue}
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 p-4" align="start">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">{label}</span>
            <span className="text-sm text-muted-foreground">
              {formatValue(localValue[0], localValue[1])}
            </span>
          </div>
          <Slider
            value={localValue}
            onValueChange={(v) => {
              setLocalValue(v as [number, number])
              onValueChange(v as [number, number])
            }}
            min={min}
            max={max}
            step={step}
            className="w-full"
          />
          {label === 'Complexity' && (
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Light</span>
              <span>Heavy</span>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}
