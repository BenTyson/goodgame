# Stripe Setup Guide

Platform configuration guide for Stripe Connect payments on Board Nomads marketplace.

## Overview

Board Nomads uses Stripe Connect with Express accounts to facilitate marketplace payments:

```
Buyer pays → Board Nomads Stripe account → Auto-transfer to Seller's Connected Account
                                         → 3% platform fee retained
                                         → 2.9% + $0.30 Stripe fee deducted
```

## 1. Stripe Account Setup

1. Create a Stripe account at [stripe.com](https://stripe.com)
2. Complete business verification
3. Enable Connect in Dashboard → Connect → Settings
4. Choose **Express** account type for sellers

### Connect Settings

| Setting | Value |
|---------|-------|
| Account type | Express |
| Seller type | Individual sellers |
| Currency | USD only |
| Payout schedule | Standard (2-day rolling) |

## 2. Environment Variables

Add these to your `.env.local` (development) and Railway environment (production):

```env
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_xxx        # Use sk_live_xxx for production
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_xxx

# Webhook Secret (from Stripe Dashboard → Webhooks)
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Getting Your Keys

1. **API Keys**: Dashboard → Developers → API keys
2. **Webhook Secret**: Dashboard → Developers → Webhooks → Your endpoint → Signing secret

## 3. Webhook Configuration

### Endpoint URL

| Environment | URL |
|-------------|-----|
| Production | `https://boardnomads.com/api/stripe/webhooks` |
| Staging | `https://goodgame-staging-staging.up.railway.app/api/stripe/webhooks` |

### Required Events

Enable these webhook events in Dashboard → Developers → Webhooks:

**Checkout Events:**
- `checkout.session.completed`
- `checkout.session.expired`

**Payment Events:**
- `payment_intent.succeeded`
- `payment_intent.payment_failed`

**Transfer Events:**
- `transfer.created`
- `transfer.failed`

**Refund Events:**
- `charge.refunded`
- `charge.refund.updated`

**Connect Account Events:**
- `account.updated`
- `account.application.deauthorized`

**Dispute Events:**
- `charge.dispute.created`
- `charge.dispute.closed`

## 4. Connect Branding

Customize the seller onboarding experience:

1. Go to Dashboard → Connect → Settings → Branding
2. Upload Board Nomads logo
3. Set brand color to match site (teal: `#14B8A6`)
4. Add support email and URL

## 5. Platform Fee Configuration

The platform fee is configured in code:

```typescript
// src/lib/config/marketplace-constants.ts
export const MARKETPLACE_FEES = {
  PLATFORM_FEE_PERCENT: 3,      // 3% platform fee
  STRIPE_FEE_PERCENT: 2.9,      // Stripe's cut
  STRIPE_FEE_FIXED: 0.30,       // $0.30 per transaction
}
```

## 6. Testing Checklist

Before going live, verify these flows work:

### Seller Onboarding
- [ ] Seller can initiate Connect account creation
- [ ] Seller completes Stripe onboarding flow
- [ ] Callback shows success/pending/error notification
- [ ] Account status updates correctly in database

### Buyer Checkout
- [ ] Buyer can complete checkout for a listing
- [ ] Payment is captured successfully
- [ ] Transaction record is created
- [ ] Seller is notified

### Payouts
- [ ] Funds are held until delivery confirmed
- [ ] Seller receives payout after delivery
- [ ] Platform fee is correctly deducted

### Refunds
- [ ] Refund can be initiated before shipping
- [ ] Refund is processed through Stripe
- [ ] Transaction status updates correctly

### Webhooks
- [ ] All webhook events are received
- [ ] Events update database correctly
- [ ] Failed webhooks are logged

## 7. Test Card Numbers

Use these test cards in development:

| Scenario | Card Number |
|----------|-------------|
| Success | 4242 4242 4242 4242 |
| Decline | 4000 0000 0000 0002 |
| Requires auth | 4000 0025 0000 3155 |
| Insufficient funds | 4000 0000 0000 9995 |

All test cards use:
- Any future expiry date
- Any 3-digit CVC
- Any postal code

## 8. Going Live

1. Switch from test to live API keys
2. Update webhook endpoint to production URL
3. Update webhook secret
4. Verify branding is set
5. Test with a real $1 transaction
6. Monitor Dashboard for any issues

## Troubleshooting

### Webhook Signature Invalid
- Ensure `STRIPE_WEBHOOK_SECRET` matches the endpoint's signing secret
- Check that you're using the correct webhook secret (test vs live)

### Connect Account Not Created
- Verify `STRIPE_SECRET_KEY` is set correctly
- Check Stripe Dashboard → Connect → Accounts for errors

### Payouts Not Working
- Seller must complete full onboarding
- Check `payouts_enabled` status in database
- Verify bank account is connected in Stripe

### Checkout Session Fails
- Verify seller has `charges_enabled: true`
- Check that listing price is within Stripe limits ($0.50 minimum)

## Related Files

| File | Purpose |
|------|---------|
| `src/lib/stripe/client.ts` | Stripe SDK initialization |
| `src/lib/stripe/connect.ts` | Connect account helpers |
| `src/app/api/stripe/webhooks/route.ts` | Webhook handler |
| `src/app/api/marketplace/stripe/connect/route.ts` | Create/get Connect account |
| `src/app/api/marketplace/stripe/connect/callback/route.ts` | Onboarding callback |
| `src/lib/supabase/transaction-queries.ts` | Transaction database operations |
| `src/lib/config/marketplace-constants.ts` | Fee configuration |
