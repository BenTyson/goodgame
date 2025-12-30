'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DollarSign, ArrowLeftRight, Handshake, Loader2, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { TradeSelector } from './TradeSelector'
import { cn } from '@/lib/utils'
import { MARKETPLACE_FEES, OFFER_SETTINGS } from '@/lib/config/marketplace-constants'
import type { OfferType, ListingWithDetails } from '@/types/marketplace'

interface MakeOfferDialogProps {
  listing: ListingWithDetails
  currentUserId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

const OFFER_TYPES: { value: OfferType; label: string; icon: typeof DollarSign; description: string }[] = [
  {
    value: 'buy',
    label: 'Cash Offer',
    icon: DollarSign,
    description: 'Make a cash offer for this game',
  },
  {
    value: 'trade',
    label: 'Trade Offer',
    icon: ArrowLeftRight,
    description: 'Offer games from your shelf in trade',
  },
  {
    value: 'buy_plus_trade',
    label: 'Cash + Trade',
    icon: Handshake,
    description: 'Combine cash with games in trade',
  },
]

export function MakeOfferDialog({
  listing,
  currentUserId,
  open,
  onOpenChange,
}: MakeOfferDialogProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [offerType, setOfferType] = useState<OfferType>('buy')
  const [amountDollars, setAmountDollars] = useState('')
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([])
  const [tradeNotes, setTradeNotes] = useState('')
  const [message, setMessage] = useState('')

  // Calculate derived values
  const amountCents = amountDollars ? Math.round(parseFloat(amountDollars) * 100) : 0
  const listingPriceDollars = listing.price_cents ? listing.price_cents / 100 : null
  const minimumOfferDollars = listing.minimum_offer_cents
    ? listing.minimum_offer_cents / 100
    : MARKETPLACE_FEES.MIN_PRICE_CENTS / 100

  // Validation
  const needsAmount = offerType === 'buy' || offerType === 'buy_plus_trade'
  const needsTrade = offerType === 'trade' || offerType === 'buy_plus_trade'

  const isAmountValid = !needsAmount || (amountCents >= MARKETPLACE_FEES.MIN_PRICE_CENTS &&
    amountCents <= MARKETPLACE_FEES.MAX_PRICE_CENTS &&
    (!listing.minimum_offer_cents || amountCents >= listing.minimum_offer_cents))

  const isTradeValid = !needsTrade || selectedGameIds.length > 0

  const canSubmit = isAmountValid && isTradeValid && !isLoading

  const handleSubmit = async () => {
    if (!canSubmit) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/marketplace/offers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listing_id: listing.id,
          offer_type: offerType,
          amount_cents: needsAmount ? amountCents : undefined,
          trade_game_ids: needsTrade ? selectedGameIds : undefined,
          trade_notes: needsTrade && tradeNotes ? tradeNotes : undefined,
          message: message || undefined,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to submit offer')
      }

      // Success - close dialog and optionally navigate
      onOpenChange(false)
      router.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit offer')
    } finally {
      setIsLoading(false)
    }
  }

  const resetForm = () => {
    setOfferType('buy')
    setAmountDollars('')
    setSelectedGameIds([])
    setTradeNotes('')
    setMessage('')
    setError(null)
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      resetForm()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Make an Offer</DialogTitle>
          <DialogDescription>
            {listing.game.name}
            {listingPriceDollars && (
              <span className="font-medium text-foreground ml-2">
                Listed at ${listingPriceDollars.toFixed(2)}
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Offer Type Selection */}
          <div className="space-y-3">
            <Label>Offer Type</Label>
            <RadioGroup
              value={offerType}
              onValueChange={(value) => setOfferType(value as OfferType)}
              className="grid grid-cols-1 gap-2"
            >
              {OFFER_TYPES.map((type) => {
                const Icon = type.icon
                return (
                  <div key={type.value}>
                    <RadioGroupItem
                      value={type.value}
                      id={`offer-type-${type.value}`}
                      className="peer sr-only"
                    />
                    <Label
                      htmlFor={`offer-type-${type.value}`}
                      className={cn(
                        'flex items-center gap-3 p-3 border rounded-lg cursor-pointer transition-colors',
                        'hover:bg-muted/50',
                        offerType === type.value
                          ? 'border-primary bg-primary/5'
                          : 'border-border'
                      )}
                    >
                      <Icon className={cn(
                        'h-5 w-5',
                        offerType === type.value ? 'text-primary' : 'text-muted-foreground'
                      )} />
                      <div className="flex-1">
                        <div className="font-medium">{type.label}</div>
                        <div className="text-xs text-muted-foreground">{type.description}</div>
                      </div>
                    </Label>
                  </div>
                )
              })}
            </RadioGroup>
          </div>

          {/* Amount Input (for buy and buy_plus_trade) */}
          {needsAmount && (
            <div className="space-y-2">
              <Label htmlFor="amount">Your Offer</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min={minimumOfferDollars}
                  max={MARKETPLACE_FEES.MAX_PRICE_CENTS / 100}
                  placeholder={`${minimumOfferDollars.toFixed(2)} or more`}
                  value={amountDollars}
                  onChange={(e) => setAmountDollars(e.target.value)}
                  className="pl-7"
                />
              </div>
              {listing.minimum_offer_cents && (
                <p className="text-xs text-muted-foreground">
                  Minimum offer: ${minimumOfferDollars.toFixed(2)}
                </p>
              )}
              {amountDollars && !isAmountValid && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {amountCents < MARKETPLACE_FEES.MIN_PRICE_CENTS
                    ? `Offer must be at least $${(MARKETPLACE_FEES.MIN_PRICE_CENTS / 100).toFixed(2)}`
                    : amountCents > MARKETPLACE_FEES.MAX_PRICE_CENTS
                      ? `Offer cannot exceed $${(MARKETPLACE_FEES.MAX_PRICE_CENTS / 100).toFixed(2)}`
                      : listing.minimum_offer_cents && amountCents < listing.minimum_offer_cents
                        ? `Minimum offer is $${minimumOfferDollars.toFixed(2)}`
                        : 'Invalid amount'}
                </p>
              )}
            </div>
          )}

          {/* Trade Game Selection (for trade and buy_plus_trade) */}
          {needsTrade && (
            <div className="space-y-2">
              <Label>Games to Trade</Label>
              <TradeSelector
                userId={currentUserId}
                selectedGameIds={selectedGameIds}
                onSelectionChange={setSelectedGameIds}
                maxGames={OFFER_SETTINGS.MAX_TRADE_GAMES}
              />
              {!isTradeValid && selectedGameIds.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Select at least one game from your shelf to trade
                </p>
              )}

              {/* Trade Notes */}
              <div className="mt-3">
                <Label htmlFor="trade-notes" className="text-sm">
                  Trade Notes (optional)
                </Label>
                <Textarea
                  id="trade-notes"
                  placeholder="Describe condition or add notes about trade games..."
                  value={tradeNotes}
                  onChange={(e) => setTradeNotes(e.target.value)}
                  className="mt-1.5 h-20"
                  maxLength={500}
                />
              </div>
            </div>
          )}

          {/* Message to Seller */}
          <div className="space-y-2">
            <Label htmlFor="message">Message to Seller (optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a message with your offer..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="h-20"
              maxLength={OFFER_SETTINGS.MAX_MESSAGE_LENGTH}
            />
            <p className="text-xs text-muted-foreground text-right">
              {message.length}/{OFFER_SETTINGS.MAX_MESSAGE_LENGTH}
            </p>
          </div>

          {/* Error Display */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-destructive/10 text-destructive rounded-lg text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!canSubmit}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              'Submit Offer'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
