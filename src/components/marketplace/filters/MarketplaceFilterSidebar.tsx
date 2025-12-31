'use client'

import * as React from 'react'
import { ChevronDown, ChevronRight, Filter, X, Tag, ArrowRightLeft, Heart, Package, Truck, MapPin, DollarSign } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useLocalStorage } from '@/hooks/use-local-storage'
import { CONDITION_INFO } from '@/types/marketplace'
import type { ListingType, GameCondition, ShippingPreference } from '@/types/marketplace'

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

export interface MarketplaceFilters {
  listingTypes: ListingType[]
  conditions: GameCondition[]
  shippingPreferences: ShippingPreference[]
  priceMin: number | null
  priceMax: number | null
}

interface MarketplaceFilterSidebarProps {
  filters: MarketplaceFilters
  onFiltersChange: (filters: MarketplaceFilters) => void
  onClearAll: () => void
  className?: string
  /** When true, renders without outer wrapper for embedding in MarketplaceSidebar */
  embedded?: boolean
}

const STORAGE_KEY = 'marketplace-filter-sections'
const DEFAULT_OPEN_SECTIONS = ['listingType', 'condition', 'price']

export function MarketplaceFilterSidebar({
  filters,
  onFiltersChange,
  onClearAll,
  className,
  embedded = false,
}: MarketplaceFilterSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useLocalStorage('marketplace-sidebar-collapsed', false)
  const [openSections, setOpenSections] = useLocalStorage<string[]>(
    STORAGE_KEY,
    DEFAULT_OPEN_SECTIONS
  )

  // Local price state for slider
  const [localPriceRange, setLocalPriceRange] = React.useState<[number, number]>([
    filters.priceMin ?? 0,
    filters.priceMax ?? 500,
  ])

  // Sync local price when filters change
  React.useEffect(() => {
    setLocalPriceRange([filters.priceMin ?? 0, filters.priceMax ?? 500])
  }, [filters.priceMin, filters.priceMax])

  const toggleSection = (sectionId: string) => {
    setOpenSections((prev) =>
      prev.includes(sectionId)
        ? prev.filter((id) => id !== sectionId)
        : [...prev, sectionId]
    )
  }

  const handleListingTypeToggle = (type: ListingType) => {
    const newTypes = filters.listingTypes.includes(type)
      ? filters.listingTypes.filter((t) => t !== type)
      : [...filters.listingTypes, type]
    onFiltersChange({ ...filters, listingTypes: newTypes })
  }

  const handleConditionToggle = (condition: GameCondition) => {
    const newConditions = filters.conditions.includes(condition)
      ? filters.conditions.filter((c) => c !== condition)
      : [...filters.conditions, condition]
    onFiltersChange({ ...filters, conditions: newConditions })
  }

  const handleShippingToggle = (pref: ShippingPreference) => {
    const newPrefs = filters.shippingPreferences.includes(pref)
      ? filters.shippingPreferences.filter((p) => p !== pref)
      : [...filters.shippingPreferences, pref]
    onFiltersChange({ ...filters, shippingPreferences: newPrefs })
  }

  const handlePriceCommit = (value: [number, number]) => {
    onFiltersChange({
      ...filters,
      priceMin: value[0] > 0 ? value[0] : null,
      priceMax: value[1] < 500 ? value[1] : null,
    })
  }

  const activeFilterCount =
    filters.listingTypes.length +
    filters.conditions.length +
    filters.shippingPreferences.length +
    (filters.priceMin !== null || filters.priceMax !== null ? 1 : 0)

  // Filter sections content - shared between embedded and standalone modes
  const filterSections = (
    <>
      {/* Listing Type */}
      <FilterSection
        title="Listing Type"
        icon={Tag}
        isOpen={openSections.includes('listingType')}
        onToggle={() => toggleSection('listingType')}
        activeCount={filters.listingTypes.length}
      >
        <div className="space-y-2">
          {LISTING_TYPE_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={filters.listingTypes.includes(option.value)}
                onCheckedChange={() => handleListingTypeToggle(option.value)}
              />
              <option.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Condition */}
      <FilterSection
        title="Condition"
        icon={Package}
        isOpen={openSections.includes('condition')}
        onToggle={() => toggleSection('condition')}
        activeCount={filters.conditions.length}
      >
        <div className="space-y-2">
          {CONDITION_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={filters.conditions.includes(option.value)}
                onCheckedChange={() => handleConditionToggle(option.value)}
              />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection
        title="Price"
        icon={DollarSign}
        isOpen={openSections.includes('price')}
        onToggle={() => toggleSection('price')}
        activeCount={filters.priceMin !== null || filters.priceMax !== null ? 1 : 0}
      >
        <div className="space-y-4 pt-1">
          <Slider
            min={0}
            max={500}
            step={5}
            value={localPriceRange}
            onValueChange={(value) => setLocalPriceRange(value as [number, number])}
            onValueCommit={(value) => handlePriceCommit(value as [number, number])}
            className="w-full"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>${localPriceRange[0]}</span>
            <span>{localPriceRange[1] >= 500 ? '$500+' : `$${localPriceRange[1]}`}</span>
          </div>
        </div>
      </FilterSection>

      {/* Shipping Preference */}
      <FilterSection
        title="Shipping"
        icon={Truck}
        isOpen={openSections.includes('shipping')}
        onToggle={() => toggleSection('shipping')}
        activeCount={filters.shippingPreferences.length}
      >
        <div className="space-y-2">
          {SHIPPING_OPTIONS.map((option) => (
            <label
              key={option.value}
              className="flex items-center gap-2 cursor-pointer"
            >
              <Checkbox
                checked={filters.shippingPreferences.includes(option.value)}
                onCheckedChange={() => handleShippingToggle(option.value)}
              />
              <option.icon className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-sm">{option.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </>
  )

  // Embedded mode: just render filter sections with header
  if (embedded) {
    return (
      <div className={cn('space-y-1', className)}>
        {/* Compact Header */}
        <div className="flex items-center justify-between px-2 py-1 mb-2">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Filters
            </span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          {activeFilterCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll}
              className="h-6 px-2 text-xs"
            >
              Clear
            </Button>
          )}
        </div>
        {filterSections}
      </div>
    )
  }

  // Standalone collapsed mode
  if (isCollapsed) {
    return (
      <aside className={cn('sticky top-20 w-14', className)}>
        <div className="rounded-lg border bg-card p-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsCollapsed(false)}
            className="w-full h-10 relative"
            aria-label="Expand filters"
          >
            <Filter className="h-4 w-4" />
            {activeFilterCount > 0 && (
              <Badge
                variant="default"
                className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
              >
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        </div>
      </aside>
    )
  }

  // Standalone expanded mode
  return (
    <aside
      className={cn(
        'sticky top-20 w-64 transition-[width] duration-200 ease-out',
        className
      )}
    >
      <div className="rounded-lg border bg-card">
        {/* Header */}
        <div className="flex items-center justify-between border-b p-3">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filters</span>
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1">
            {activeFilterCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearAll}
                className="h-7 px-2 text-xs"
              >
                Clear
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsCollapsed(true)}
              className="h-8 w-8"
              aria-label="Collapse filters"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Filter sections */}
        <div className="p-2 space-y-1">
          {filterSections}
        </div>
      </div>
    </aside>
  )
}

interface FilterSectionProps {
  title: string
  icon: React.ElementType
  isOpen: boolean
  onToggle: () => void
  activeCount?: number
  children: React.ReactNode
}

function FilterSection({
  title,
  icon: Icon,
  isOpen,
  onToggle,
  activeCount = 0,
  children,
}: FilterSectionProps) {
  return (
    <div className="rounded-md">
      <button
        onClick={onToggle}
        className="flex items-center justify-between w-full px-2 py-2 hover:bg-muted/50 rounded-md transition-colors"
      >
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{title}</span>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
              {activeCount}
            </Badge>
          )}
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        )}
      </button>
      {isOpen && <div className="px-2 pb-2 pt-1">{children}</div>}
    </div>
  )
}

// Export collapsed state hook for use by other components
export function useMarketplaceSidebarCollapsed() {
  return useLocalStorage('marketplace-sidebar-collapsed', false)
}
