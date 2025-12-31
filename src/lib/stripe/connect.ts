/**
 * Stripe Connect Helpers
 *
 * Functions for managing Stripe Connect accounts for marketplace sellers.
 */

import { stripe, calculateTransactionFees } from './client'
import type Stripe from 'stripe'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

/**
 * Create a Stripe Connect Express account for a seller
 * @param userId - The seller's user ID
 * @param email - The seller's email
 * @returns The created account
 */
export async function createConnectAccount(
  userId: string,
  email: string
): Promise<Stripe.Account> {
  return stripe.accounts.create({
    type: 'express',
    email,
    metadata: {
      user_id: userId,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
  })
}

/**
 * Create an account link for Stripe Connect onboarding
 * @param accountId - The Stripe Connect account ID
 * @returns Account link URL for onboarding
 */
export async function createConnectAccountLink(
  accountId: string
): Promise<string> {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${APP_URL}/api/marketplace/stripe/connect/refresh`,
    return_url: `${APP_URL}/marketplace/dashboard?tab=account&stripe=connected`,
    type: 'account_onboarding',
  })

  return accountLink.url
}

/**
 * Create a login link for an existing Connect account
 * @param accountId - The Stripe Connect account ID
 * @returns Login link URL for the Stripe Express dashboard
 */
export async function createConnectLoginLink(
  accountId: string
): Promise<string> {
  const loginLink = await stripe.accounts.createLoginLink(accountId)
  return loginLink.url
}

/**
 * Get a Stripe Connect account by ID
 * @param accountId - The Stripe Connect account ID
 * @returns The account details
 */
export async function getConnectAccount(
  accountId: string
): Promise<Stripe.Account> {
  return stripe.accounts.retrieve(accountId)
}

/**
 * Check if a Connect account is fully onboarded and ready for payments
 * @param accountId - The Stripe Connect account ID
 * @returns Object with onboarding status
 */
export async function checkConnectAccountStatus(accountId: string): Promise<{
  isOnboarded: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requiresAction: boolean
}> {
  const account = await getConnectAccount(accountId)

  return {
    isOnboarded: account.details_submitted && account.charges_enabled && account.payouts_enabled,
    chargesEnabled: account.charges_enabled || false,
    payoutsEnabled: account.payouts_enabled || false,
    detailsSubmitted: account.details_submitted || false,
    requiresAction: !account.details_submitted || !account.charges_enabled,
  }
}

/**
 * Create a payment intent for a marketplace transaction
 * Uses Stripe Connect destination charges
 * @param params Payment intent parameters
 * @returns The created payment intent
 */
export async function createPaymentIntent(params: {
  amountCents: number
  shippingCents: number
  sellerStripeAccountId: string
  transactionId: string
  buyerId: string
  sellerId: string
  listingTitle: string
}): Promise<Stripe.PaymentIntent> {
  const {
    amountCents,
    shippingCents,
    sellerStripeAccountId,
    transactionId,
    buyerId,
    sellerId,
    listingTitle,
  } = params

  const totalAmount = amountCents + shippingCents
  const { platformFee } = calculateTransactionFees(totalAmount)

  return stripe.paymentIntents.create(
    {
      amount: totalAmount,
      currency: 'usd',
      // Using destination charges - platform collects payment, seller gets transfer
      transfer_data: {
        destination: sellerStripeAccountId,
      },
      // Platform fee is automatically deducted
      application_fee_amount: platformFee,
      metadata: {
        transaction_id: transactionId,
        buyer_id: buyerId,
        seller_id: sellerId,
        listing_title: listingTitle,
      },
    },
    {
      // Ensure idempotency for retries
      idempotencyKey: `transaction_${transactionId}`,
    }
  )
}

/**
 * Create a Checkout Session for a marketplace transaction
 * Better UX than raw PaymentIntent for marketplaces
 */
export async function createCheckoutSession(params: {
  amountCents: number
  shippingCents: number
  sellerStripeAccountId: string
  transactionId: string
  buyerId: string
  sellerId: string
  listingTitle: string
  gameImageUrl?: string
  successUrl: string
  cancelUrl: string
}): Promise<Stripe.Checkout.Session> {
  const {
    amountCents,
    shippingCents,
    sellerStripeAccountId,
    transactionId,
    buyerId,
    sellerId,
    listingTitle,
    gameImageUrl,
    successUrl,
    cancelUrl,
  } = params

  const totalAmount = amountCents + shippingCents
  const { platformFee } = calculateTransactionFees(totalAmount)

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [
    {
      price_data: {
        currency: 'usd',
        product_data: {
          name: listingTitle,
          images: gameImageUrl ? [gameImageUrl] : [],
        },
        unit_amount: amountCents,
      },
      quantity: 1,
    },
  ]

  // Add shipping as separate line item if present
  if (shippingCents > 0) {
    lineItems.push({
      price_data: {
        currency: 'usd',
        product_data: {
          name: 'Shipping',
        },
        unit_amount: shippingCents,
      },
      quantity: 1,
    })
  }

  return stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: lineItems,
    payment_intent_data: {
      transfer_data: {
        destination: sellerStripeAccountId,
      },
      application_fee_amount: platformFee,
      metadata: {
        transaction_id: transactionId,
        buyer_id: buyerId,
        seller_id: sellerId,
        listing_title: listingTitle,
      },
    },
    success_url: successUrl,
    cancel_url: cancelUrl,
    metadata: {
      transaction_id: transactionId,
      buyer_id: buyerId,
      seller_id: sellerId,
    },
  })
}

/**
 * Retrieve a payment intent by ID
 */
export async function getPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.retrieve(paymentIntentId)
}

/**
 * Cancel a payment intent
 */
export async function cancelPaymentIntent(
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return stripe.paymentIntents.cancel(paymentIntentId)
}

/**
 * Create a refund for a completed payment
 */
export async function createRefund(params: {
  paymentIntentId: string
  amountCents?: number // Partial refund amount, or full if not specified
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
}): Promise<Stripe.Refund> {
  const { paymentIntentId, amountCents, reason } = params

  return stripe.refunds.create({
    payment_intent: paymentIntentId,
    amount: amountCents,
    reason,
    reverse_transfer: true, // Also reverse the transfer to connected account
    refund_application_fee: true, // Refund platform fee
  })
}

/**
 * Verify a webhook signature
 */
export function verifyWebhookSignature(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
