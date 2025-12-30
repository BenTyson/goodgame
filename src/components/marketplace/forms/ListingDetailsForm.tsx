'use client'

import * as React from 'react'
import { Tag, ArrowRightLeft, Heart, Package } from 'lucide-react'

import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { cn } from '@/lib/utils'
import { CONDITION_INFO } from '@/types/marketplace'
import type { ListingType, GameCondition } from '@/types/marketplace'

const LISTING_TYPE_OPTIONS: { value: ListingType; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: 'sell',
    label: 'For Sale',
    description: 'Sell this game for money',
    icon: Tag,
  },
  {
    value: 'trade',
    label: 'For Trade',
    description: 'Trade for other games',
    icon: ArrowRightLeft,
  },
  {
    value: 'want',
    label: 'Want to Buy',
    description: 'Looking for this game',
    icon: Heart,
  },
]

const CONDITION_OPTIONS: GameCondition[] = [
  'new_sealed',
  'like_new',
  'very_good',
  'good',
  'acceptable',
]

interface ListingDetailsFormProps {
  listingType: ListingType
  condition: GameCondition | null
  description: string
  onListingTypeChange: (type: ListingType) => void
  onConditionChange: (condition: GameCondition) => void
  onDescriptionChange: (description: string) => void
  className?: string
}

export function ListingDetailsForm({
  listingType,
  condition,
  description,
  onListingTypeChange,
  onConditionChange,
  onDescriptionChange,
  className,
}: ListingDetailsFormProps) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Listing Type */}
      <div className="space-y-3">
        <Label className="text-base font-medium">What do you want to do?</Label>
        <div className="grid grid-cols-3 gap-3">
          {LISTING_TYPE_OPTIONS.map((option) => {
            const isSelected = listingType === option.value
            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onListingTypeChange(option.value)}
                className={cn(
                  'flex flex-col items-center gap-2 p-4 rounded-lg border-2 transition-all',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/50'
                )}
              >
                <option.icon
                  className={cn(
                    'h-6 w-6',
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span className={cn('font-medium', isSelected && 'text-primary')}>
                  {option.label}
                </span>
                <span className="text-xs text-muted-foreground text-center">
                  {option.description}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Condition (only for sell/trade) */}
      {listingType !== 'want' && (
        <div className="space-y-3">
          <Label className="text-base font-medium">Condition</Label>
          <RadioGroup
            value={condition || ''}
            onValueChange={(value) => onConditionChange(value as GameCondition)}
            className="space-y-2"
          >
            {CONDITION_OPTIONS.map((conditionOption) => {
              const info = CONDITION_INFO[conditionOption]
              const isSelected = condition === conditionOption
              return (
                <label
                  key={conditionOption}
                  className={cn(
                    'flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/30'
                  )}
                >
                  <RadioGroupItem value={conditionOption} className="mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{info.label}</span>
                      <Package className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {info.description}
                    </p>
                  </div>
                </label>
              )
            })}
          </RadioGroup>
        </div>
      )}

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-base font-medium">
          Description
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder={
            listingType === 'want'
              ? "Describe what you're looking for, your budget, and any other details..."
              : 'Describe the condition of your game, what is included, any damage or missing pieces...'
          }
          rows={5}
          className="resize-none"
        />
        <p className="text-xs text-muted-foreground">
          Be specific about the contents and condition to avoid disputes.
        </p>
      </div>
    </div>
  )
}
