/**
 * Stripe Webhooks Handler
 *
 * Handles Stripe webhook events for:
 * - Payment confirmations
 * - Checkout session completions
 * - Connect account updates
 * - Refunds
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import Stripe from 'stripe'
import { verifyWebhookSignature } from '@/lib/stripe/connect'
import {
  getTransactionByPaymentIntent,
  getTransactionByCheckoutSession,
  markTransactionPaid,
  updateTransaction,
  releaseFunds,
} from '@/lib/supabase/transaction-queries'
import { updateStripeConnectInfo } from '@/lib/supabase/transaction-queries'

const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

/**
 * POST - Handle Stripe webhook events
 */
export async function POST(request: NextRequest) {
  if (!WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured')
    return NextResponse.json(
      { error: 'Webhook not configured' },
      { status: 500 }
    )
  }

  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = verifyWebhookSignature(body, signature, WEBHOOK_SECRET)
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      // ========================================
      // PAYMENT EVENTS
      // ========================================

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode !== 'payment') break

        // Find transaction by checkout session ID
        const transaction = await getTransactionByCheckoutSession(session.id)

        if (!transaction) {
          console.error('Transaction not found for checkout session:', session.id)
          break
        }

        // Get payment intent ID from session
        const paymentIntentId = session.payment_intent as string

        // Mark transaction as paid
        await markTransactionPaid(
          transaction.id,
          paymentIntentId
        )

        console.log('Transaction marked as paid:', transaction.id)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        // Check if we have a transaction for this payment intent
        const transaction = await getTransactionByPaymentIntent(paymentIntent.id)

        if (transaction) {
          // Already handled by checkout.session.completed
          console.log('Payment intent succeeded (already processed):', paymentIntent.id)
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent

        const transaction = await getTransactionByPaymentIntent(paymentIntent.id)

        if (transaction && transaction.status === 'payment_processing') {
          // Update transaction status back to pending_payment
          await updateTransaction(transaction.id, {
            status: 'pending_payment',
          })

          console.log('Payment failed, transaction reset:', transaction.id)
        }
        break
      }

      // ========================================
      // TRANSFER EVENTS (funds to sellers)
      // ========================================

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer

        // Get transaction ID from transfer metadata
        const transactionId = transfer.metadata?.transaction_id

        if (transactionId) {
          await updateTransaction(transactionId, {
            stripe_transfer_id: transfer.id,
          })

          // Note: In Stripe Connect with destination charges,
          // transfers are created automatically and we can consider
          // funds released when the transfer is created
          console.log('Transfer created for transaction:', transactionId)
        }
        break
      }

      // ========================================
      // REFUND EVENTS
      // ========================================

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge

        // Get transaction by payment intent
        if (charge.payment_intent) {
          const transaction = await getTransactionByPaymentIntent(
            charge.payment_intent as string
          )

          if (transaction) {
            await updateTransaction(transaction.id, {
              status: 'refunded',
            })

            console.log('Transaction refunded:', transaction.id)
          }
        }
        break
      }

      // ========================================
      // CONNECT ACCOUNT EVENTS
      // ========================================

      case 'account.updated': {
        const account = event.data.object as Stripe.Account

        // Get user ID from account metadata
        const userId = account.metadata?.user_id

        if (userId) {
          await updateStripeConnectInfo(userId, {
            stripeAccountStatus: account.charges_enabled ? 'active' : 'pending',
            stripeOnboardingComplete: account.details_submitted || false,
            stripeChargesEnabled: account.charges_enabled || false,
            stripePayoutsEnabled: account.payouts_enabled || false,
          })

          console.log('Connect account updated for user:', userId)
        }
        break
      }

      // ========================================
      // DISPUTE EVENTS
      // ========================================

      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute

        // Get transaction by charge
        if (dispute.charge) {
          // Need to get payment intent from charge
          // For now, log the dispute
          console.warn('Dispute created:', dispute.id)
          // TODO: Implement dispute handling
        }
        break
      }

      default:
        console.log('Unhandled webhook event:', event.type)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}
