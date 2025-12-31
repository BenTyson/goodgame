'use client'

import { AlertTriangle, CreditCard, ExternalLink } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { StripeConnectButton } from '@/components/marketplace/transactions/StripeConnectButton'
import type { DashboardStripeStatus } from '@/types/marketplace'

interface StripeOnboardingBannerProps {
  status: DashboardStripeStatus
}

export function StripeOnboardingBanner({ status }: StripeOnboardingBannerProps) {
  // Don't show if fully onboarded
  if (status.onboardingComplete && status.chargesEnabled && status.payoutsEnabled) {
    return null
  }

  // Not connected at all
  if (!status.connected) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="flex items-start gap-4 pt-6">
          <CreditCard className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-1">
              Set up payments to start selling
            </h3>
            <p className="text-sm text-amber-700 mb-3">
              Connect your Stripe account to receive payments when your items sell.
              It only takes a few minutes to set up.
            </p>
            <StripeConnectButton />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Connected but incomplete onboarding
  if (!status.onboardingComplete || !status.chargesEnabled) {
    return (
      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="flex items-start gap-4 pt-6">
          <AlertTriangle className="h-6 w-6 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-amber-800 mb-1">
              Complete your payment setup
            </h3>
            <p className="text-sm text-amber-700 mb-3">
              Your Stripe account needs additional information before you can receive payments.
              Please complete the onboarding process.
            </p>
            <StripeConnectButton />
          </div>
        </CardContent>
      </Card>
    )
  }

  // Charges enabled but payouts not
  if (!status.payoutsEnabled) {
    return (
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="flex items-start gap-4 pt-6">
          <CreditCard className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-800 mb-1">
              Payouts pending verification
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              You can receive payments, but Stripe is still verifying your payout details.
              This usually completes within 1-2 business days.
            </p>
            <Button variant="outline" size="sm" asChild>
              <a
                href="https://dashboard.stripe.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2"
              >
                Check Stripe Dashboard
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return null
}
