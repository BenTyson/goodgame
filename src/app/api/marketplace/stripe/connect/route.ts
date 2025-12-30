/**
 * Stripe Connect API
 *
 * POST - Create or get Stripe Connect account and onboarding link
 * GET - Get current Connect account status
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  createConnectAccount,
  createConnectAccountLink,
  createConnectLoginLink,
  checkConnectAccountStatus,
} from '@/lib/stripe/connect'
import {
  getUserMarketplaceSettings,
  updateStripeConnectInfo,
} from '@/lib/supabase/transaction-queries'
import type { StripeConnectStatus, StripeConnectOnboardingResponse } from '@/types/marketplace'

/**
 * GET - Get current Stripe Connect status
 */
export async function GET() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getUserMarketplaceSettings(user.id)

    if (!settings?.stripeAccountId) {
      return NextResponse.json<StripeConnectStatus>({
        hasAccount: false,
        accountId: null,
        isOnboarded: false,
        chargesEnabled: false,
        payoutsEnabled: false,
        detailsSubmitted: false,
        requiresAction: true,
      })
    }

    // Check current status from Stripe
    const status = await checkConnectAccountStatus(settings.stripeAccountId)

    // Update local cache if status changed
    if (
      status.chargesEnabled !== settings.stripeChargesEnabled ||
      status.payoutsEnabled !== settings.stripePayoutsEnabled ||
      status.isOnboarded !== settings.stripeOnboardingComplete
    ) {
      await updateStripeConnectInfo(user.id, {
        stripeOnboardingComplete: status.isOnboarded,
        stripeChargesEnabled: status.chargesEnabled,
        stripePayoutsEnabled: status.payoutsEnabled,
        stripeAccountStatus: status.isOnboarded ? 'active' : 'pending',
      })
    }

    return NextResponse.json<StripeConnectStatus>({
      hasAccount: true,
      accountId: settings.stripeAccountId,
      isOnboarded: status.isOnboarded,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      detailsSubmitted: status.detailsSubmitted,
      requiresAction: status.requiresAction,
    })
  } catch (error) {
    console.error('Error getting Stripe Connect status:', error)
    return NextResponse.json(
      { error: 'Failed to get payment status' },
      { status: 500 }
    )
  }
}

/**
 * POST - Create Connect account or get onboarding/login link
 */
export async function POST() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const settings = await getUserMarketplaceSettings(user.id)

    let accountId = settings?.stripeAccountId

    // Create account if doesn't exist
    if (!accountId) {
      const account = await createConnectAccount(user.id, user.email || '')
      accountId = account.id

      // Save to database
      await updateStripeConnectInfo(user.id, {
        stripeAccountId: accountId,
        stripeAccountStatus: 'pending',
        stripeOnboardingComplete: false,
        stripeChargesEnabled: false,
        stripePayoutsEnabled: false,
      })
    }

    // Check if fully onboarded
    const status = await checkConnectAccountStatus(accountId)

    if (status.isOnboarded) {
      // Return login link to Stripe Express dashboard
      const loginUrl = await createConnectLoginLink(accountId)

      return NextResponse.json({
        accountId,
        dashboardUrl: loginUrl,
        isOnboarded: true,
      })
    }

    // Return onboarding link
    const onboardingUrl = await createConnectAccountLink(accountId)

    return NextResponse.json<StripeConnectOnboardingResponse>({
      accountId,
      onboardingUrl,
    })
  } catch (error) {
    console.error('Error creating Stripe Connect account:', error)
    return NextResponse.json(
      { error: 'Failed to set up payments' },
      { status: 500 }
    )
  }
}
