'use client'

import { useState } from 'react'
import { Bell, BellPlus, Check, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import type {
  SavedSearchFilters,
  AlertFrequency,
  CreateSavedSearchRequest,
} from '@/types/marketplace'
import { ALERT_FREQUENCY_INFO } from '@/types/marketplace'
import { generateSavedSearchName } from '@/lib/utils/saved-search-utils'

interface SaveSearchButtonProps {
  filters: SavedSearchFilters
  isLoggedIn: boolean
  className?: string
  variant?: 'default' | 'outline' | 'ghost'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  onSave?: (request: CreateSavedSearchRequest) => Promise<void>
  onLoginRequired?: () => void
}

export function SaveSearchButton({
  filters,
  isLoggedIn,
  className,
  variant = 'outline',
  size = 'default',
  onSave,
  onLoginRequired,
}: SaveSearchButtonProps) {
  const [open, setOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Form state
  const [name, setName] = useState('')
  const [alertFrequency, setAlertFrequency] = useState<AlertFrequency>('instant')
  const [alertEmail, setAlertEmail] = useState(true)

  // Generate default name when dialog opens
  const handleOpenChange = (newOpen: boolean) => {
    if (newOpen && !isLoggedIn) {
      onLoginRequired?.()
      return
    }

    if (newOpen) {
      // Generate name from filters
      setName(generateSavedSearchName(filters))
      setSaved(false)
    }
    setOpen(newOpen)
  }

  const handleSave = async () => {
    if (!onSave) return

    setIsSaving(true)
    try {
      await onSave({
        name: name.trim() || generateSavedSearchName(filters),
        filters,
        alert_frequency: alertFrequency,
        alert_email: alertEmail,
      })
      setSaved(true)
      // Close dialog after short delay to show success
      setTimeout(() => {
        setOpen(false)
        setSaved(false)
      }, 1000)
    } catch (error) {
      console.error('Failed to save search:', error)
    } finally {
      setIsSaving(false)
    }
  }

  // Check if there are any active filters
  const hasFilters =
    filters.query ||
    (filters.listing_types && filters.listing_types.length > 0) ||
    (filters.conditions && filters.conditions.length > 0) ||
    filters.price_min_cents ||
    filters.price_max_cents ||
    filters.max_distance_miles ||
    (filters.game_ids && filters.game_ids.length > 0) ||
    (filters.category_ids && filters.category_ids.length > 0)

  if (!hasFilters) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={cn('gap-2', className)}>
          <BellPlus className="h-4 w-4" />
          <span className="hidden sm:inline">Save Search</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Save This Search</DialogTitle>
          <DialogDescription>
            Get notified when new listings match your search criteria.
          </DialogDescription>
        </DialogHeader>

        {saved ? (
          <div className="flex flex-col items-center justify-center py-8 gap-3">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <Check className="h-6 w-6 text-green-600" />
            </div>
            <p className="text-sm font-medium text-green-600">Search saved!</p>
          </div>
        ) : (
          <>
            <div className="space-y-4 py-4">
              {/* Name */}
              <div className="space-y-2">
                <Label htmlFor="search-name">Name</Label>
                <Input
                  id="search-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="My saved search"
                  maxLength={100}
                />
              </div>

              {/* Alert Frequency */}
              <div className="space-y-2">
                <Label htmlFor="alert-frequency">Alert Frequency</Label>
                <Select
                  value={alertFrequency}
                  onValueChange={(value) => setAlertFrequency(value as AlertFrequency)}
                >
                  <SelectTrigger id="alert-frequency">
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(ALERT_FREQUENCY_INFO) as AlertFrequency[]).map((freq) => (
                      <SelectItem key={freq} value={freq}>
                        <div className="flex flex-col">
                          <span>{ALERT_FREQUENCY_INFO[freq].label}</span>
                          <span className="text-xs text-muted-foreground">
                            {ALERT_FREQUENCY_INFO[freq].description}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Email Alerts */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="email-alerts">Email Alerts</Label>
                  <p className="text-xs text-muted-foreground">
                    Receive email notifications for matches
                  </p>
                </div>
                <Switch
                  id="email-alerts"
                  checked={alertEmail}
                  onCheckedChange={setAlertEmail}
                />
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Bell className="h-4 w-4 mr-2" />
                    Save Search
                  </>
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
