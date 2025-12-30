'use client'

import * as React from 'react'
import { DollarSign, Truck, MapPin, Package, Calendar } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { LISTING_DURATIONS } from '@/lib/config/marketplace-constants'
import type { ListingType, ShippingPreference } from '@/types/marketplace'

const SHIPPING_OPTIONS: { value: ShippingPreference; label: string; description: string; icon: React.ElementType }[] = [
  {
    value: 'local_only',
    label: 'Local Pickup Only',
    description: 'Buyer must pick up in person',
    icon: MapPin,
  },
  {
    value: 'will_ship',
    label: 'Will Ship',
    description: 'Can ship or do local pickup',
    icon: Truck,
  },
  {
    value: 'ship_only',
    label: 'Shipping Only',
    description: 'No local pickup available',
    icon: Package,
  },
]

const US_STATES = [
  { value: 'AL', label: 'Alabama' }, { value: 'AK', label: 'Alaska' },
  { value: 'AZ', label: 'Arizona' }, { value: 'AR', label: 'Arkansas' },
  { value: 'CA', label: 'California' }, { value: 'CO', label: 'Colorado' },
  { value: 'CT', label: 'Connecticut' }, { value: 'DE', label: 'Delaware' },
  { value: 'FL', label: 'Florida' }, { value: 'GA', label: 'Georgia' },
  { value: 'HI', label: 'Hawaii' }, { value: 'ID', label: 'Idaho' },
  { value: 'IL', label: 'Illinois' }, { value: 'IN', label: 'Indiana' },
  { value: 'IA', label: 'Iowa' }, { value: 'KS', label: 'Kansas' },
  { value: 'KY', label: 'Kentucky' }, { value: 'LA', label: 'Louisiana' },
  { value: 'ME', label: 'Maine' }, { value: 'MD', label: 'Maryland' },
  { value: 'MA', label: 'Massachusetts' }, { value: 'MI', label: 'Michigan' },
  { value: 'MN', label: 'Minnesota' }, { value: 'MS', label: 'Mississippi' },
  { value: 'MO', label: 'Missouri' }, { value: 'MT', label: 'Montana' },
  { value: 'NE', label: 'Nebraska' }, { value: 'NV', label: 'Nevada' },
  { value: 'NH', label: 'New Hampshire' }, { value: 'NJ', label: 'New Jersey' },
  { value: 'NM', label: 'New Mexico' }, { value: 'NY', label: 'New York' },
  { value: 'NC', label: 'North Carolina' }, { value: 'ND', label: 'North Dakota' },
  { value: 'OH', label: 'Ohio' }, { value: 'OK', label: 'Oklahoma' },
  { value: 'OR', label: 'Oregon' }, { value: 'PA', label: 'Pennsylvania' },
  { value: 'RI', label: 'Rhode Island' }, { value: 'SC', label: 'South Carolina' },
  { value: 'SD', label: 'South Dakota' }, { value: 'TN', label: 'Tennessee' },
  { value: 'TX', label: 'Texas' }, { value: 'UT', label: 'Utah' },
  { value: 'VT', label: 'Vermont' }, { value: 'VA', label: 'Virginia' },
  { value: 'WA', label: 'Washington' }, { value: 'WV', label: 'West Virginia' },
  { value: 'WI', label: 'Wisconsin' }, { value: 'WY', label: 'Wyoming' },
  { value: 'DC', label: 'Washington DC' },
]

interface PricingFormProps {
  listingType: ListingType
  priceDollars: string
  shippingCostDollars: string
  shippingPreference: ShippingPreference
  locationCity: string
  locationState: string
  durationDays: number
  onPriceChange: (value: string) => void
  onShippingCostChange: (value: string) => void
  onShippingPreferenceChange: (value: ShippingPreference) => void
  onLocationCityChange: (value: string) => void
  onLocationStateChange: (value: string) => void
  onDurationChange: (value: number) => void
  className?: string
}

export function PricingForm({
  listingType,
  priceDollars,
  shippingCostDollars,
  shippingPreference,
  locationCity,
  locationState,
  durationDays,
  onPriceChange,
  onShippingCostChange,
  onShippingPreferenceChange,
  onLocationCityChange,
  onLocationStateChange,
  onDurationChange,
  className,
}: PricingFormProps) {
  const showPricing = listingType === 'sell'
  const showShippingCost = shippingPreference !== 'local_only' && listingType === 'sell'

  return (
    <div className={cn('space-y-6', className)}>
      {/* Price (only for sell) */}
      {showPricing && (
        <div className="space-y-2">
          <Label htmlFor="price" className="text-base font-medium">
            Asking Price
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="price"
              type="number"
              min="0"
              step="0.01"
              value={priceDollars}
              onChange={(e) => onPriceChange(e.target.value)}
              placeholder="0.00"
              className="pl-8"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Price buyers will see. You'll receive this minus our 3% platform fee.
          </p>
        </div>
      )}

      {/* Shipping Preference */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Shipping Options</Label>
        <RadioGroup
          value={shippingPreference}
          onValueChange={(value) => onShippingPreferenceChange(value as ShippingPreference)}
          className="space-y-2"
        >
          {SHIPPING_OPTIONS.map((option) => {
            const isSelected = shippingPreference === option.value
            return (
              <label
                key={option.value}
                className={cn(
                  'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                  isSelected
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-primary/30'
                )}
              >
                <RadioGroupItem value={option.value} />
                <option.icon
                  className={cn(
                    'h-5 w-5',
                    isSelected ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <div className="flex-1">
                  <span className="font-medium">{option.label}</span>
                  <p className="text-sm text-muted-foreground">{option.description}</p>
                </div>
              </label>
            )
          })}
        </RadioGroup>
      </div>

      {/* Shipping Cost (only if shipping is enabled and selling) */}
      {showShippingCost && (
        <div className="space-y-2">
          <Label htmlFor="shippingCost" className="text-base font-medium">
            Shipping Cost
          </Label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="shippingCost"
              type="number"
              min="0"
              step="0.01"
              value={shippingCostDollars}
              onChange={(e) => onShippingCostChange(e.target.value)}
              placeholder="0.00 (free shipping)"
              className="pl-8"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Leave at $0 for free shipping. Shipping costs are paid by the buyer.
          </p>
        </div>
      )}

      {/* Location */}
      <div className="space-y-3">
        <Label className="text-base font-medium">Your Location</Label>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="city" className="text-sm">City</Label>
            <Input
              id="city"
              value={locationCity}
              onChange={(e) => onLocationCityChange(e.target.value)}
              placeholder="City"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state" className="text-sm">State</Label>
            <Select value={locationState} onValueChange={onLocationStateChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select state" />
              </SelectTrigger>
              <SelectContent>
                {US_STATES.map((state) => (
                  <SelectItem key={state.value} value={state.value}>
                    {state.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          Your city and state will be shown to buyers for local pickup and shipping estimates.
        </p>
      </div>

      {/* Listing Duration */}
      <div className="space-y-2">
        <Label className="text-base font-medium flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          Listing Duration
        </Label>
        <Select
          value={String(durationDays)}
          onValueChange={(value) => onDurationChange(parseInt(value))}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {LISTING_DURATIONS.map((option) => (
              <SelectItem key={option.value} value={String(option.value)}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          After this period, you can renew your listing.
        </p>
      </div>
    </div>
  )
}
