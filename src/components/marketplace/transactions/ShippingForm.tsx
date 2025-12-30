'use client'

import * as React from 'react'
import { Truck, Loader2, ExternalLink } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { SHIPPING_CARRIERS, type ShippingCarrier } from '@/types/marketplace'

interface ShippingFormProps {
  transactionId: string
  existingCarrier?: ShippingCarrier | null
  existingTrackingNumber?: string | null
  canShip: boolean
  className?: string
  onShipped?: () => void
  onError?: (error: string) => void
}

export function ShippingForm({
  transactionId,
  existingCarrier,
  existingTrackingNumber,
  canShip,
  className,
  onShipped,
  onError,
}: ShippingFormProps) {
  const [carrier, setCarrier] = React.useState<ShippingCarrier>(existingCarrier || 'usps')
  const [trackingNumber, setTrackingNumber] = React.useState(existingTrackingNumber || '')
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)

  const hasExistingTracking = !!existingTrackingNumber

  const handleSaveTracking = async () => {
    if (!trackingNumber.trim()) return

    setIsSaving(true)

    try {
      const response = await fetch(`/api/marketplace/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'add_tracking',
          shipping_carrier: carrier,
          tracking_number: trackingNumber.trim(),
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save tracking')
      }

      // Don't call onShipped for just saving tracking
    } catch (error) {
      console.error('Error saving tracking:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to save tracking')
    } finally {
      setIsSaving(false)
    }
  }

  const handleMarkShipped = async () => {
    setIsSubmitting(true)

    try {
      const response = await fetch(`/api/marketplace/transactions/${transactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'mark_shipped',
          shipping_carrier: carrier,
          tracking_number: trackingNumber.trim() || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to mark as shipped')
      }

      onShipped?.()
    } catch (error) {
      console.error('Error marking shipped:', error)
      onError?.(error instanceof Error ? error.message : 'Failed to mark as shipped')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Build tracking URL
  const trackingUrl = trackingNumber && carrier !== 'other'
    ? `${SHIPPING_CARRIERS[carrier].trackingUrl}${trackingNumber}`
    : null

  return (
    <div className={cn('space-y-4', className)}>
      <div className="space-y-2">
        <Label htmlFor="carrier">Shipping Carrier</Label>
        <Select
          value={carrier}
          onValueChange={(value) => setCarrier(value as ShippingCarrier)}
          disabled={!canShip && hasExistingTracking}
        >
          <SelectTrigger id="carrier">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.entries(SHIPPING_CARRIERS) as [ShippingCarrier, { label: string }][]).map(
              ([value, { label }]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              )
            )}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="tracking">Tracking Number (Optional)</Label>
        <div className="flex gap-2">
          <Input
            id="tracking"
            value={trackingNumber}
            onChange={(e) => setTrackingNumber(e.target.value)}
            placeholder="Enter tracking number"
            disabled={!canShip && hasExistingTracking}
          />
          {trackingUrl && (
            <Button
              variant="outline"
              size="icon"
              asChild
            >
              <a
                href={trackingUrl}
                target="_blank"
                rel="noopener noreferrer"
                title="Track package"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          )}
        </div>
      </div>

      {canShip ? (
        <Button
          onClick={handleMarkShipped}
          disabled={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Marking as Shipped...
            </>
          ) : (
            <>
              <Truck className="h-4 w-4 mr-2" />
              Mark as Shipped
            </>
          )}
        </Button>
      ) : hasExistingTracking ? (
        <div className="text-sm text-muted-foreground">
          <p>
            <strong>Carrier:</strong> {SHIPPING_CARRIERS[existingCarrier!].label}
          </p>
          {existingTrackingNumber && (
            <p>
              <strong>Tracking:</strong> {existingTrackingNumber}
            </p>
          )}
        </div>
      ) : (
        <Button
          variant="outline"
          onClick={handleSaveTracking}
          disabled={isSaving || !trackingNumber.trim()}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            'Save Tracking Info'
          )}
        </Button>
      )}
    </div>
  )
}
