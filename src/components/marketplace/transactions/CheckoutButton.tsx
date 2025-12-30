'use client'

import * as React from 'react'
import { CreditCard, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface CheckoutButtonProps {
  transactionId: string
  disabled?: boolean
  className?: string
  onSuccess?: () => void
  onError?: (error: string) => void
}

export function CheckoutButton({
  transactionId,
  disabled,
  className,
  onSuccess,
  onError,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = React.useState(false)

  const handleCheckout = async () => {
    setIsLoading(true)

    try {
      const response = await fetch(`/api/marketplace/transactions/${transactionId}/checkout`, {
        method: 'POST',
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to create checkout session')
      }

      const data = await response.json()

      // Redirect to Stripe Checkout
      window.location.href = data.checkout_url
      onSuccess?.()
    } catch (error) {
      console.error('Checkout error:', error)
      onError?.(error instanceof Error ? error.message : 'Checkout failed')
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleCheckout}
      disabled={disabled || isLoading}
      className={cn('w-full', className)}
    >
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Redirecting to payment...
        </>
      ) : (
        <>
          <CreditCard className="h-4 w-4 mr-2" />
          Pay Now
        </>
      )}
    </Button>
  )
}
