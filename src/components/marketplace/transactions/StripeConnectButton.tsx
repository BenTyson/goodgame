'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { CreditCard, ExternalLink, Loader2, CheckCircle, AlertCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { StripeConnectStatus } from '@/types/marketplace'

interface StripeConnectButtonProps {
  className?: string
  onStatusChange?: (status: StripeConnectStatus) => void
}

export function StripeConnectButton({
  className,
  onStatusChange,
}: StripeConnectButtonProps) {
  const router = useRouter()
  const [status, setStatus] = React.useState<StripeConnectStatus | null>(null)
  const [isLoading, setIsLoading] = React.useState(true)
  const [isConnecting, setIsConnecting] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  // Fetch current status on mount
  React.useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch('/api/marketplace/stripe/connect')
        if (!response.ok) throw new Error('Failed to fetch status')
        const data = await response.json()
        setStatus(data)
        onStatusChange?.(data)
      } catch (err) {
        console.error('Error fetching Stripe status:', err)
        setError('Failed to load payment status')
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatus()
  }, [onStatusChange])

  const handleConnect = async () => {
    setIsConnecting(true)
    setError(null)

    try {
      const response = await fetch('/api/marketplace/stripe/connect', {
        method: 'POST',
      })

      if (!response.ok) throw new Error('Failed to connect')

      const data = await response.json()

      if (data.onboardingUrl) {
        // Redirect to Stripe onboarding
        window.location.href = data.onboardingUrl
      } else if (data.dashboardUrl) {
        // Redirect to Stripe dashboard
        window.location.href = data.dashboardUrl
      }
    } catch (err) {
      console.error('Error connecting Stripe:', err)
      setError('Failed to set up payments')
      setIsConnecting(false)
    }
  }

  if (isLoading) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm text-muted-foreground">Loading payment status...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <AlertCircle className="h-4 w-4 text-destructive" />
        <span className="text-sm text-destructive">{error}</span>
        <Button variant="outline" size="sm" onClick={() => router.refresh()}>
          Retry
        </Button>
      </div>
    )
  }

  // Not connected
  if (!status?.hasAccount) {
    return (
      <div className={cn('space-y-3', className)}>
        <p className="text-sm text-muted-foreground">
          Set up payments to receive money from your sales. We use Stripe for secure payment processing.
        </p>
        <Button onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Setting up...
            </>
          ) : (
            <>
              <CreditCard className="h-4 w-4 mr-2" />
              Set Up Payments
            </>
          )}
        </Button>
      </div>
    )
  }

  // Account exists but not fully onboarded
  if (!status.isOnboarded) {
    return (
      <div className={cn('space-y-3', className)}>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
            <AlertCircle className="h-3 w-3 mr-1" />
            Setup Incomplete
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          Complete your Stripe account setup to start receiving payments.
        </p>
        <Button onClick={handleConnect} disabled={isConnecting}>
          {isConnecting ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Loading...
            </>
          ) : (
            <>
              <ExternalLink className="h-4 w-4 mr-2" />
              Complete Setup
            </>
          )}
        </Button>
      </div>
    )
  }

  // Fully connected
  return (
    <div className={cn('space-y-3', className)}>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="h-3 w-3 mr-1" />
          Payments Enabled
        </Badge>
        {status.chargesEnabled && (
          <Badge variant="outline" className="text-xs">
            Can Accept Payments
          </Badge>
        )}
        {status.payoutsEnabled && (
          <Badge variant="outline" className="text-xs">
            Payouts Enabled
          </Badge>
        )}
      </div>
      <p className="text-sm text-muted-foreground">
        Your Stripe account is set up and ready to receive payments.
      </p>
      <Button variant="outline" onClick={handleConnect} disabled={isConnecting}>
        {isConnecting ? (
          <>
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            Loading...
          </>
        ) : (
          <>
            <ExternalLink className="h-4 w-4 mr-2" />
            Open Stripe Dashboard
          </>
        )}
      </Button>
    </div>
  )
}
