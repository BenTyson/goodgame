'use client'

import { useState } from 'react'
import { Bell, BellOff, BellRing, Settings, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Checkbox } from '@/components/ui/checkbox'
import type {
  WishlistAlert,
  GameCondition,
  CreateWishlistAlertRequest,
  UpdateWishlistAlertRequest,
} from '@/types/marketplace'
import { CONDITION_INFO } from '@/types/marketplace'

interface WishlistAlertToggleProps {
  gameId: string
  gameName: string
  alert: WishlistAlert | null
  isLoggedIn: boolean
  className?: string
  onEnable?: (request: CreateWishlistAlertRequest) => Promise<void>
  onUpdate?: (id: string, request: UpdateWishlistAlertRequest) => Promise<void>
  onDisable?: (id: string) => Promise<void>
  onLoginRequired?: () => void
}

const ALL_CONDITIONS: GameCondition[] = [
  'new_sealed',
  'like_new',
  'very_good',
  'good',
  'acceptable',
]

export function WishlistAlertToggle({
  gameId,
  gameName,
  alert,
  isLoggedIn,
  className,
  onEnable,
  onUpdate,
  onDisable,
  onLoginRequired,
}: WishlistAlertToggleProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Form state
  const [maxPrice, setMaxPrice] = useState<string>(
    alert?.max_price_cents ? (alert.max_price_cents / 100).toString() : ''
  )
  const [conditions, setConditions] = useState<GameCondition[]>(
    alert?.accepted_conditions || ['new_sealed', 'like_new', 'very_good']
  )
  const [localOnly, setLocalOnly] = useState(alert?.local_only || false)

  const isEnabled = alert?.alerts_enabled ?? false
  const hasSettings = alert !== null

  const handleToggle = async () => {
    if (!isLoggedIn) {
      onLoginRequired?.()
      return
    }

    setIsLoading(true)
    try {
      if (hasSettings && isEnabled) {
        // Disable existing alert
        await onDisable?.(alert!.id)
      } else if (hasSettings && !isEnabled) {
        // Re-enable existing alert
        await onUpdate?.(alert!.id, { alerts_enabled: true })
      } else {
        // Create new alert with defaults
        await onEnable?.({
          game_id: gameId,
          accepted_conditions: ['new_sealed', 'like_new', 'very_good'],
        })
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      const priceInCents = maxPrice ? Math.round(parseFloat(maxPrice) * 100) : null

      if (hasSettings) {
        await onUpdate?.(alert!.id, {
          max_price_cents: priceInCents,
          accepted_conditions: conditions,
          local_only: localOnly,
        })
      } else {
        await onEnable?.({
          game_id: gameId,
          max_price_cents: priceInCents || undefined,
          accepted_conditions: conditions,
          local_only: localOnly,
        })
      }
      setOpen(false)
    } finally {
      setIsLoading(false)
    }
  }

  const toggleCondition = (condition: GameCondition) => {
    setConditions((prev) =>
      prev.includes(condition)
        ? prev.filter((c) => c !== condition)
        : [...prev, condition]
    )
  }

  return (
    <div className={cn('flex items-center gap-2', className)}>
      {/* Main Toggle Button */}
      <Button
        variant={isEnabled ? 'default' : 'outline'}
        size="sm"
        onClick={handleToggle}
        disabled={isLoading}
        className={cn(
          'gap-2',
          isEnabled && 'bg-primary hover:bg-primary/90'
        )}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isEnabled ? (
          <BellRing className="h-4 w-4" />
        ) : (
          <Bell className="h-4 w-4" />
        )}
        <span className="hidden sm:inline">
          {isEnabled ? 'Alert On' : 'Alert Me'}
        </span>
      </Button>

      {/* Settings Popover */}
      {isLoggedIn && (
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              title="Alert settings"
            >
              <Settings className="h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="end">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-sm">Alert Settings</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  Get notified when {gameName} is listed
                </p>
              </div>

              {/* Max Price */}
              <div className="space-y-2">
                <Label htmlFor="max-price" className="text-sm">
                  Maximum Price
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    $
                  </span>
                  <Input
                    id="max-price"
                    type="number"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(e.target.value)}
                    placeholder="Any price"
                    className="pl-7"
                    min={0}
                    step={1}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty for any price
                </p>
              </div>

              {/* Conditions */}
              <div className="space-y-2">
                <Label className="text-sm">Accepted Conditions</Label>
                <div className="space-y-2">
                  {ALL_CONDITIONS.map((condition) => (
                    <label
                      key={condition}
                      className="flex items-center gap-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={conditions.includes(condition)}
                        onCheckedChange={() => toggleCondition(condition)}
                      />
                      <span className="text-sm">
                        {CONDITION_INFO[condition].label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Local Only */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="local-only" className="text-sm">
                    Local Pickup Only
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    Only show listings near you
                  </p>
                </div>
                <Switch
                  id="local-only"
                  checked={localOnly}
                  onCheckedChange={setLocalOnly}
                />
              </div>

              {/* Save Button */}
              <Button
                onClick={handleSaveSettings}
                disabled={isLoading || conditions.length === 0}
                className="w-full"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Settings'
                )}
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}

      {/* Match Count Badge */}
      {alert && alert.match_count > 0 && (
        <Badge variant="secondary" className="text-[10px]">
          {alert.match_count} match{alert.match_count !== 1 ? 'es' : ''}
        </Badge>
      )}
    </div>
  )
}
