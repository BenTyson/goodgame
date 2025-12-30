'use client'

import * as React from 'react'
import { Filter, X, Tag, ArrowRightLeft, Heart, Package, Truck, MapPin, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { ListingType, GameCondition, ShippingPreference } from '@/types/marketplace'
import type { MarketplaceFilters } from './MarketplaceFilterSidebar'

const LISTING_TYPE_OPTIONS: { value: ListingType; label: string; icon: React.ElementType }[] = [
  { value: 'sell', label: 'For Sale', icon: Tag },
  { value: 'trade', label: 'For Trade', icon: ArrowRightLeft },
  { value: 'want', label: 'Wanted', icon: Heart },
]

const CONDITION_OPTIONS: { value: GameCondition; label: string }[] = [
  { value: 'new_sealed', label: 'New (Sealed)' },
  { value: 'like_new', label: 'Like New' },
  { value: 'very_good', label: 'Very Good' },
  { value: 'good', label: 'Good' },
  { value: 'acceptable', label: 'Acceptable' },
]

const SHIPPING_OPTIONS: { value: ShippingPreference; label: string; icon: React.ElementType }[] = [
  { value: 'local_only', label: 'Local Pickup Only', icon: MapPin },
  { value: 'will_ship', label: 'Will Ship', icon: Truck },
  { value: 'ship_only', label: 'Shipping Only', icon: Package },
]

interface MobileMarketplaceFiltersProps {
  filters: MarketplaceFilters
  onFiltersChange: (filters: MarketplaceFilters) => void
  onClearAll: () => void
  resultsCount: number
  className?: string
}

export function MobileMarketplaceFilters({
  filters,
  onFiltersChange,
  onClearAll,
  resultsCount,
  className,
}: MobileMarketplaceFiltersProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const [localFilters, setLocalFilters] = React.useState<MarketplaceFilters>(filters)
  const [localPriceRange, setLocalPriceRange] = React.useState<[number, number]>([
    filters.priceMin ?? 0,
    filters.priceMax ?? 500,
  ])

  // Sync local state when sheet opens
  React.useEffect(() => {
    if (isOpen) {
      setLocalFilters(filters)
      setLocalPriceRange([filters.priceMin ?? 0, filters.priceMax ?? 500])
    }
  }, [isOpen, filters])

  const activeFilterCount =
    filters.listingTypes.length +
    filters.conditions.length +
    filters.shippingPreferences.length +
    (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0)

  const handleListingTypeToggle = (type: ListingType) => {
    const newTypes = localFilters.listingTypes.includes(type)
      ? localFilters.listingTypes.filter((t) => t !== type)
      : [...localFilters.listingTypes, type]
    setLocalFilters({ ...localFilters, listingTypes: newTypes })
  }

  const handleConditionToggle = (condition: GameCondition) => {
    const newConditions = localFilters.conditions.includes(condition)
      ? localFilters.conditions.filter((c) => c !== condition)
      : [...localFilters.conditions, condition]
    setLocalFilters({ ...localFilters, conditions: newConditions })
  }

  const handleShippingToggle = (pref: ShippingPreference) => {
    const newPrefs = localFilters.shippingPreferences.includes(pref)
      ? localFilters.shippingPreferences.filter((p) => p !== pref)
      : [...localFilters.shippingPreferences, pref]
    setLocalFilters({ ...localFilters, shippingPreferences: newPrefs })
  }

  const handleApply = () => {
    onFiltersChange({
      ...localFilters,
      priceMin: localPriceRange[0] > 0 ? localPriceRange[0] : null,
      priceMax: localPriceRange[1] < 500 ? localPriceRange[1] : null,
    })
    setIsOpen(false)
  }

  const handleClear = () => {
    setLocalFilters({
      listingTypes: [],
      conditions: [],
      shippingPreferences: [],
      priceMin: null,
      priceMax: null,
    })
    setLocalPriceRange([0, 500])
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          className={cn('lg:hidden gap-2', className)}
        >
          <Filter className="h-4 w-4" />
          <span>Filters</span>
          {activeFilterCount > 0 && (
            <Badge variant="secondary" className="ml-1">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="h-[85vh] rounded-t-xl">
        <SheetHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <SheetTitle>Filters</SheetTitle>
            <Button variant="ghost" size="sm" onClick={handleClear}>
              Clear all
            </Button>
          </div>
        </SheetHeader>

        <div className="overflow-y-auto flex-1 py-4 space-y-6">
          {/* Listing Type */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Tag className="h-4 w-4 text-muted-foreground" />
              Listing Type
            </h3>
            <div className="grid grid-cols-3 gap-2">
              {LISTING_TYPE_OPTIONS.map((option) => {
                const isSelected = localFilters.listingTypes.includes(option.value)
                return (
                  <button
                    key={option.value}
                    onClick={() => handleListingTypeToggle(option.value)}
                    className={cn(
                      'flex flex-col items-center gap-1 p-3 rounded-lg border transition-colors',
                      isSelected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border hover:border-primary/50'
                    )}
                  >
                    <option.icon className="h-5 w-5" />
                    <span className="text-xs font-medium">{option.label}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Condition */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              Condition
            </h3>
            <div className="space-y-2">
              {CONDITION_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={localFilters.conditions.includes(option.value)}
                    onCheckedChange={() => handleConditionToggle(option.value)}
                  />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Price Range */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              Price Range
            </h3>
            <div className="space-y-4 px-2">
              <Slider
                min={0}
                max={500}
                step={5}
                value={localPriceRange}
                onValueChange={(value) => setLocalPriceRange(value as [number, number])}
                className="w-full"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>${localPriceRange[0]}</span>
                <span>{localPriceRange[1] >= 500 ? '$500+' : `$${localPriceRange[1]}`}</span>
              </div>
            </div>
          </div>

          {/* Shipping */}
          <div className="space-y-3">
            <h3 className="font-medium flex items-center gap-2">
              <Truck className="h-4 w-4 text-muted-foreground" />
              Shipping Options
            </h3>
            <div className="space-y-2">
              {SHIPPING_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                >
                  <Checkbox
                    checked={localFilters.shippingPreferences.includes(option.value)}
                    onCheckedChange={() => handleShippingToggle(option.value)}
                  />
                  <option.icon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <SheetFooter className="border-t pt-4">
          <Button onClick={handleApply} className="w-full" size="lg">
            Show {resultsCount} {resultsCount === 1 ? 'listing' : 'listings'}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}
