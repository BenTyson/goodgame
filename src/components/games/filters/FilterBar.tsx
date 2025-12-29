'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import { RangeFilterPopover } from './RangeFilterPopover'
import { RANGE_FILTERS } from './constants'
import { DEFAULT_RANGES } from './types'

interface FilterBarProps {
  playerCount: [number, number]
  playTime: [number, number]
  weight: [number, number]
  onPlayerCountChange: (value: [number, number]) => void
  onPlayTimeChange: (value: [number, number]) => void
  onWeightChange: (value: [number, number]) => void
  onPlayerCountCommit: (value: [number, number]) => void
  onPlayTimeCommit: (value: [number, number]) => void
  onWeightCommit: (value: [number, number]) => void
  className?: string
}

export function FilterBar({
  playerCount,
  playTime,
  weight,
  onPlayerCountChange,
  onPlayTimeChange,
  onWeightChange,
  onPlayerCountCommit,
  onPlayTimeCommit,
  onWeightCommit,
  className,
}: FilterBarProps) {
  const playersConfig = RANGE_FILTERS.find((f) => f.key === 'players')!
  const timeConfig = RANGE_FILTERS.find((f) => f.key === 'time')!
  const weightConfig = RANGE_FILTERS.find((f) => f.key === 'weight')!

  return (
    <div
      className={cn(
        'flex flex-wrap items-center gap-2 rounded-lg bg-muted/30 p-2',
        className
      )}
    >
      <RangeFilterPopover
        icon={playersConfig.icon}
        label={playersConfig.label}
        value={playerCount}
        defaultValue={[DEFAULT_RANGES.players.min, DEFAULT_RANGES.players.max]}
        min={playersConfig.min}
        max={playersConfig.max}
        step={playersConfig.step}
        formatValue={playersConfig.formatValue}
        onValueChange={onPlayerCountChange}
        onValueCommit={onPlayerCountCommit}
      />
      <RangeFilterPopover
        icon={timeConfig.icon}
        label={timeConfig.label}
        value={playTime}
        defaultValue={[DEFAULT_RANGES.time.min, DEFAULT_RANGES.time.max]}
        min={timeConfig.min}
        max={timeConfig.max}
        step={timeConfig.step}
        formatValue={timeConfig.formatValue}
        onValueChange={onPlayTimeChange}
        onValueCommit={onPlayTimeCommit}
      />
      <RangeFilterPopover
        icon={weightConfig.icon}
        label={weightConfig.label}
        value={weight}
        defaultValue={[DEFAULT_RANGES.weight.min, DEFAULT_RANGES.weight.max]}
        min={weightConfig.min}
        max={weightConfig.max}
        step={weightConfig.step}
        formatValue={weightConfig.formatValue}
        onValueChange={onWeightChange}
        onValueCommit={onWeightCommit}
      />
    </div>
  )
}
