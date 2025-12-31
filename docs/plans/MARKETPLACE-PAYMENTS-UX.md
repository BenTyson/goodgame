# Marketplace Payment Setup: Seller Onboarding UX & Platform Configuration

> Plan created: 2025-12-31
> Status: Ready for implementation

## Overview

Improve the seller payment onboarding experience and document platform-level Stripe configuration requirements. Currently, payment setup is buried and lacks feedback - sellers don't know what's needed, what's blocking them, or when setup completes.

## Current State Analysis

### Money Flow (Already Implemented)
```
Buyer pays → Board Nomads Stripe account → Auto-transfer to Seller's Connected Account
                                         → 3% platform fee retained
                                         → 2.9% + $0.30 Stripe fee deducted
```

### Current UX Problems

| Issue | Impact |
|-------|--------|
| No callback feedback | User returns from Stripe with no success/error message |
| Payment setup not in Action Required | Sellers don't see it as a priority task |
| No status indicator in dashboard | Must navigate to Settings to check status |
| Incomplete setup messaging unclear | Doesn't explain what's blocking charges/payouts |
| No help text | Users don't know what info Stripe will request |

## Implementation Plan

### Phase 1: Callback Feedback & Toast Notifications

**Goal:** Show clear success/error messages when returning from Stripe onboarding.

**Files to modify:**
- `src/app/settings/SettingsContent.tsx` - Handle `?stripe=` query params
- `src/app/settings/page.tsx` - Pass searchParams to client

**Changes:**
1. Read `stripe` query param (connected/pending/error)
2. Show toast notification on mount based on param
3. Clear param from URL after showing toast

```
?stripe=connected → "Payment setup complete! You can now sell on the marketplace."
?stripe=pending   → "Almost there! Stripe is verifying your details (1-2 business days)."
?stripe=error     → "Setup incomplete. Please try again or contact support."
```

---

### Phase 2: Add Payment Setup to Action Required System

**Goal:** Payment setup appears as a high-priority action item on dashboard.

**Files to modify:**
- `src/types/marketplace.ts` - Add `payment_setup` to ActionRequiredType
- `src/lib/supabase/dashboard-queries.ts` - Include payment status in action items
- `src/components/marketplace/dashboard/ActionRequiredItem.tsx` - Handle payment_setup type

**Changes:**
1. Add `payment_setup` type to ActionRequiredType union
2. In `getActionRequiredItems()`, check if user has listings but no Stripe setup
3. Return action item with urgency: 'high' if seller has active listings without payments
4. Action button: "Set Up Payments" → redirects to Settings or Stripe directly

---

### Phase 3: Payment Status Indicator in Dashboard

**Goal:** Quick visual indicator showing payment setup status without navigating away.

**Option A: Add to HorizontalStats bar**
- New chip: "Payments: Not Set Up" (yellow) or "Payments: Active" (green)
- Clickable → opens Settings payments section

**Option B: Add to SidebarQuickActions footer**
- Show payment status badge near earnings display
- Makes sense since earnings require payment setup

**Recommended:** Option A - more visible, consistent with other status indicators

**Files to modify:**
- `src/components/marketplace/dashboard/HorizontalStats.tsx` - Add payment status chip
- `src/app/marketplace/dashboard/SellerDashboardClient.tsx` - Pass stripe status

---

### Phase 4: Non-Intrusive Dismissible Banner

**Goal:** Less prominent banner that can be dismissed, with status visible elsewhere.

**Files to modify:**
- `src/components/marketplace/dashboard/StripeOnboardingBanner.tsx`

**Changes:**
1. **Make banner dismissible** (localStorage `stripe-banner-dismissed`)
2. **Smaller, less prominent design** - inline alert style rather than large card
3. **Improve messaging** when shown:
   - If `!chargesEnabled`: "Identity verification in progress..."
   - If `!payoutsEnabled`: "Bank account verification pending (1-2 days)..."
   - If `!detailsSubmitted`: "Please complete your profile in Stripe..."
4. **Rely on HorizontalStats chip** (Phase 3) for persistent visibility after dismiss

**Future:** Full account setup wizard will address onboarding holistically

---

### Phase 5: Platform Configuration Documentation

**Goal:** Document what Board Nomads needs to configure in Stripe Dashboard.

**Create:** `docs/STRIPE-SETUP.md`

**Contents:**
1. **Stripe Account Setup**
   - Create Stripe account at stripe.com
   - Enable Connect in Dashboard → Connect → Settings
   - Choose "Express" account type for sellers

2. **Environment Variables Required**
   ```
   STRIPE_SECRET_KEY=sk_live_xxx (or sk_test_xxx for staging)
   STRIPE_PUBLISHABLE_KEY=pk_live_xxx
   STRIPE_WEBHOOK_SECRET=whsec_xxx
   ```

3. **Webhook Configuration**
   - Endpoint URL: `https://boardnomads.com/api/stripe/webhooks`
   - Events to enable:
     - checkout.session.completed
     - payment_intent.succeeded
     - payment_intent.payment_failed
     - transfer.created
     - charge.refunded
     - account.updated
     - charge.dispute.created

4. **Connect Settings**
   - Branding: Upload Board Nomads logo for seller dashboard
   - Express account settings: Individual sellers, USD only
   - Payout schedule: Standard (2-day rolling)

5. **Testing Checklist**
   - [ ] Seller can create Connect account
   - [ ] Seller completes onboarding
   - [ ] Buyer can complete checkout
   - [ ] Seller receives payout
   - [ ] Refund flow works
   - [ ] Webhooks fire correctly

---

## File Summary

| File | Change |
|------|--------|
| `src/app/settings/SettingsContent.tsx` | Handle Stripe callback params, show toast |
| `src/app/settings/page.tsx` | Pass searchParams |
| `src/types/marketplace.ts` | Add `payment_setup` to ActionRequiredType |
| `src/lib/supabase/dashboard-queries.ts` | Include payment setup in action items |
| `src/components/marketplace/dashboard/ActionRequiredItem.tsx` | Handle payment_setup rendering |
| `src/components/marketplace/dashboard/HorizontalStats.tsx` | Add payment status chip |
| `src/components/marketplace/dashboard/StripeOnboardingBanner.tsx` | Improve messaging |
| `src/app/marketplace/dashboard/SellerDashboardClient.tsx` | Pass stripe status to HorizontalStats |
| `docs/STRIPE-SETUP.md` | NEW - Platform configuration guide |

## Implementation Order

1. **Phase 1: Callback Feedback** - Quick win, immediate UX improvement
2. **Phase 5: Documentation** - Can be done in parallel, no code dependencies
3. **Phase 3: Status Indicator** - Adds visibility in dashboard (enables banner dismissal)
4. **Phase 4: Dismissible Banner** - Lighter touch, relies on Phase 3
5. **Phase 2: Action Required** - Optional for now, most complex (can defer to account setup work)

## Questions Resolved

- **Money flow?** Platform collects, auto-transfers to seller (destination charges)
- **Do sellers need Stripe account?** Yes, Express account created through onboarding
- **What does seller configure?** Legal info, bank account, ID verification (via Stripe UI)
- **What does platform configure?** Stripe Connect account, webhooks, environment variables

## Future Work (Not This Phase)

- **Account Setup Wizard** - Guided onboarding flow covering profile, payments, shipping in one place
- **Tax Reporting** - 1099-K generation for sellers meeting thresholds
- **Dispute Resolution** - Admin tools for handling chargebacks
