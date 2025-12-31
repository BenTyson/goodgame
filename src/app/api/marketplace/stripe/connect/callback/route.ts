/**
 * Stripe Connect Callback
 *
 * Handles the return from Stripe Connect onboarding
 * This is a redirect endpoint, not an API endpoint
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import {
  checkConnectAccountStatus,
} from '@/lib/stripe/connect'
import {
  getUserMarketplaceSettings,
  updateStripeConnectInfo,
} from '@/lib/supabase/transaction-queries'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login?redirect=/settings')
    }

    const settings = await getUserMarketplaceSettings(user.id)

    if (!settings?.stripeAccountId) {
      // No account, redirect to dashboard
      redirect('/marketplace/dashboard?tab=account&stripe=error&message=no_account')
    }

    // Check current status from Stripe
    const status = await checkConnectAccountStatus(settings.stripeAccountId)

    // Update local cache
    await updateStripeConnectInfo(user.id, {
      stripeOnboardingComplete: status.isOnboarded,
      stripeChargesEnabled: status.chargesEnabled,
      stripePayoutsEnabled: status.payoutsEnabled,
      stripeAccountStatus: status.isOnboarded ? 'active' : 'pending',
    })

    if (status.isOnboarded) {
      redirect('/marketplace/dashboard?tab=account&stripe=connected')
    } else {
      redirect('/marketplace/dashboard?tab=account&stripe=pending')
    }
  } catch (error) {
    console.error('Error in Stripe Connect callback:', error)
    redirect('/marketplace/dashboard?tab=account&stripe=error')
  }
}
