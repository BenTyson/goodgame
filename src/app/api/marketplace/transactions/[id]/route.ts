/**
 * Transaction Detail API
 *
 * GET - Get transaction details
 * PATCH - Update transaction (add tracking, confirm delivery, etc.)
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import {
  getTransactionById,
  shipTransaction,
  confirmDelivery,
  requestRefund,
  updateTransaction,
} from '@/lib/supabase/transaction-queries'
import type { TransactionUpdateRequest, ShippingCarrier } from '@/types/marketplace'

interface RouteParams {
  params: Promise<{ id: string }>
}

/**
 * GET - Get transaction details
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transaction = await getTransactionById(id)

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user is buyer or seller
    if (transaction.buyer_id !== user.id && transaction.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Error fetching transaction:', error)
    return NextResponse.json(
      { error: 'Failed to fetch transaction' },
      { status: 500 }
    )
  }
}

/**
 * PATCH - Update transaction
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = await params
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transaction = await getTransactionById(id)

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Verify user is buyer or seller
    if (transaction.buyer_id !== user.id && transaction.seller_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json() as TransactionUpdateRequest
    const { action, shipping_carrier, tracking_number, message } = body

    switch (action) {
      case 'add_tracking': {
        // Seller action - add tracking without changing status
        if (user.id !== transaction.seller_id) {
          return NextResponse.json(
            { error: 'Only seller can add tracking' },
            { status: 403 }
          )
        }

        if (transaction.status !== 'payment_held' && transaction.status !== 'shipped') {
          return NextResponse.json(
            { error: 'Cannot add tracking in current state' },
            { status: 400 }
          )
        }

        const updated = await updateTransaction(id, {
          shipping_carrier: shipping_carrier as ShippingCarrier,
          tracking_number,
        })

        return NextResponse.json({ transaction: updated })
      }

      case 'mark_shipped': {
        // Seller action - mark as shipped
        if (user.id !== transaction.seller_id) {
          return NextResponse.json(
            { error: 'Only seller can mark as shipped' },
            { status: 403 }
          )
        }

        if (transaction.status !== 'payment_held') {
          return NextResponse.json(
            { error: 'Transaction must be in payment_held state to ship' },
            { status: 400 }
          )
        }

        if (!shipping_carrier) {
          return NextResponse.json(
            { error: 'shipping_carrier is required' },
            { status: 400 }
          )
        }

        const shipped = await shipTransaction(
          id,
          user.id,
          shipping_carrier as ShippingCarrier,
          tracking_number
        )

        return NextResponse.json({ transaction: shipped })
      }

      case 'confirm_delivery': {
        // Buyer action - confirm item received
        if (user.id !== transaction.buyer_id) {
          return NextResponse.json(
            { error: 'Only buyer can confirm delivery' },
            { status: 403 }
          )
        }

        if (transaction.status !== 'shipped') {
          return NextResponse.json(
            { error: 'Transaction must be shipped to confirm delivery' },
            { status: 400 }
          )
        }

        const delivered = await confirmDelivery(id, user.id)

        return NextResponse.json({ transaction: delivered })
      }

      case 'request_refund': {
        // Buyer action - request refund
        if (user.id !== transaction.buyer_id) {
          return NextResponse.json(
            { error: 'Only buyer can request refund' },
            { status: 403 }
          )
        }

        if (!['payment_held', 'shipped'].includes(transaction.status)) {
          return NextResponse.json(
            { error: 'Cannot request refund in current state' },
            { status: 400 }
          )
        }

        const refundRequested = await requestRefund(id, user.id, message)

        return NextResponse.json({ transaction: refundRequested })
      }

      case 'release_funds': {
        // This is handled automatically or by admin
        return NextResponse.json(
          { error: 'Funds are released automatically after delivery confirmation' },
          { status: 400 }
        )
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }
  } catch (error) {
    console.error('Error updating transaction:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update transaction' },
      { status: 500 }
    )
  }
}
