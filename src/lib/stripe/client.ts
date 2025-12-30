/**
 * Stripe Server-Side Client
 *
 * Server-side Stripe SDK initialization for API routes and server components.
 * IMPORTANT: This should only be imported in server-side code.
 */

import Stripe from 'stripe'

/**
 * Lazy-initialized Stripe client
 * Prevents build-time errors when STRIPE_SECRET_KEY isn't available
 */
let _stripe: Stripe | null = null

/**
 * Get the Stripe client instance
 * Throws at runtime if STRIPE_SECRET_KEY is not configured
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Missing STRIPE_SECRET_KEY environment variable')
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2025-12-15.clover',
      typescript: true,
    })
  }
  return _stripe
}

/**
 * Server-side Stripe client (getter for backward compatibility)
 * @deprecated Use getStripe() instead for explicit lazy initialization
 */
export const stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    return getStripe()[prop as keyof Stripe]
  },
})

/**
 * Calculate Stripe fee for a given amount
 * @param amountCents - Amount in cents
 * @returns Stripe fee in cents (2.9% + $0.30)
 */
export function calculateStripeFee(amountCents: number): number {
  // Stripe fee: 2.9% + $0.30
  const percentageFee = Math.round(amountCents * 0.029)
  const fixedFee = 30
  return percentageFee + fixedFee
}

/**
 * Calculate platform fee for a given amount
 * @param amountCents - Amount in cents
 * @returns Platform fee in cents (3%)
 */
export function calculatePlatformFee(amountCents: number): number {
  return Math.round(amountCents * 0.03)
}

/**
 * Calculate all fees and payout for a transaction
 * @param amountCents - Total amount in cents (item + shipping)
 * @returns Breakdown of fees and seller payout
 */
export function calculateTransactionFees(amountCents: number): {
  totalAmount: number
  stripeFee: number
  platformFee: number
  sellerPayout: number
} {
  const stripeFee = calculateStripeFee(amountCents)
  const platformFee = calculatePlatformFee(amountCents)
  const sellerPayout = amountCents - stripeFee - platformFee

  return {
    totalAmount: amountCents,
    stripeFee,
    platformFee,
    sellerPayout,
  }
}
