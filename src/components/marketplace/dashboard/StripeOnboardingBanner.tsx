'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, CreditCard, ExternalLink, X, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import type { DashboardStripeStatus } from '@/types/marketplace'

const DISMISS_KEY = 'stripe-banner-dismissed'

interface StripeOnboardingBannerProps {
  status: DashboardStripeStatus
}

export function StripeOnboardingBanner({ status }: StripeOnboardingBannerProps) {
  const [isDismissed, setIsDismissed] = useState(true) // Start hidden to prevent flash

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY)
    // Reset dismissal if status changes significantly (e.g., user disconnects account)
    if (dismissed && !status.connected) {
      localStorage.removeItem(DISMISS_KEY)
      setIsDismissed(false)
    } else {
      setIsDismissed(dismissed === 'true')
    }
  }, [status.connected])

  const handleDismiss = () => {
    localStorage.setItem(DISMISS_KEY, 'true')
    setIsDismissed(true)
  }

  // Don't show if fully onboarded
  if (status.onboardingComplete && status.chargesEnabled && status.payoutsEnabled) {
    return null
  }

  // Don't show if dismissed (users can check status via HorizontalStats chip)
  if (isDismissed) {
    return null
  }

  // Not connected at all - more prominent since this is critical
  if (!status.connected) {
    return (
      <div className="relative flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
        <CreditCard className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">Set up payments</span>
            {' '}to receive money when your items sell.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/marketplace/dashboard?tab=account">Set Up</Link>
        </Button>
        <button
          onClick={handleDismiss}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Connected but incomplete onboarding - needs action
  if (!status.onboardingComplete || !status.chargesEnabled) {
    return (
      <div className="relative flex items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800">
        <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-amber-800 dark:text-amber-200">
            <span className="font-medium">Identity verification required</span>
            {' '}- complete your Stripe profile to accept payments.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/marketplace/dashboard?tab=account">Complete</Link>
        </Button>
        <button
          onClick={handleDismiss}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-200 p-1"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  // Charges enabled but payouts not - informational
  if (!status.payoutsEnabled) {
    return (
      <div className="relative flex items-center gap-3 p-3 rounded-lg bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800">
        <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-blue-800 dark:text-blue-200">
            <span className="font-medium">Bank verification pending</span>
            {' '}- you can accept payments, payouts will be enabled within 1-2 business days.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <a
            href="https://dashboard.stripe.com"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5"
          >
            Stripe
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
        <button
          onClick={handleDismiss}
          className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 p-1"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return null
}
