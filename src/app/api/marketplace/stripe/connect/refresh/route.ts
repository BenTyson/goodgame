/**
 * Stripe Connect Refresh
 *
 * Generates a new onboarding link when the old one expires
 * This is called when user's onboarding link has expired
 */

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createConnectAccountLink } from '@/lib/stripe/connect'
import { getUserMarketplaceSettings } from '@/lib/supabase/transaction-queries'

export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      redirect('/login?redirect=/settings')
    }

    const settings = await getUserMarketplaceSettings(user.id)

    if (!settings?.stripeAccountId) {
      // No account, redirect to settings to create one
      redirect('/settings?stripe=error&message=no_account')
    }

    // Generate new onboarding link
    const onboardingUrl = await createConnectAccountLink(settings.stripeAccountId)

    // Redirect directly to Stripe
    redirect(onboardingUrl)
  } catch (error) {
    console.error('Error refreshing Stripe Connect link:', error)
    redirect('/settings?stripe=error&message=refresh_failed')
  }
}
