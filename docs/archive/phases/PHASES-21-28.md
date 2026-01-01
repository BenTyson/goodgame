# Archived Phases: 21-28 (Marketplace Build)

> **Archived:** 2026-01-01
> **Status:** All phases COMPLETE
> **Summary:** Full marketplace implementation with listings, messaging, offers, payments, reputation, discovery, and unified UI.

---

## Phase 28: Marketplace UI/UX Unification (COMPLETE)

Unified marketplace page layout to match the seller dashboard sidebar pattern.

### Marketplace Sidebar Unification (2025-12-31)
- **Consistent Layout** - Both `/marketplace` and `/marketplace/dashboard` use same sidebar pattern
- **MarketplaceSidebar Component** - New wrapper with header, filters, quick links, action button
- **Embedded Filter Mode** - `MarketplaceFilterSidebar` now supports `embedded` prop for sidebar integration
- **Quick Links** - My Listings, My Offers, My Sales link to dashboard tabs (authenticated users)
- **Deep Linking** - Dashboard supports `?tab=` URL parameter for direct navigation
- **Mobile Header** - Hamburger menu with filter badge matching dashboard pattern
- **Loading Skeleton** - New `/marketplace/loading.tsx` matching sidebar layout

### New/Updated Components
```
src/components/marketplace/
├── MarketplaceSidebar.tsx      # NEW - Sidebar wrapper matching dashboard
├── filters/
│   └── MarketplaceFilterSidebar.tsx  # UPDATED - Added embedded prop
└── index.ts                    # UPDATED - Export MarketplaceSidebar
```

### Updated Files
| File | Change |
|------|--------|
| `src/app/marketplace/MarketplacePageClient.tsx` | New flex layout with sidebar |
| `src/app/marketplace/loading.tsx` | NEW - Loading skeleton for sidebar layout |
| `src/app/marketplace/dashboard/SellerDashboardClient.tsx` | Added URL tab sync |

---

## Phase 27: Marketplace Phase 7 - Seller Dashboard V2 (COMPLETE)

Built unified seller dashboard with sidebar layout (Faire-inspired).

### Phase 7: Seller Dashboard V2 (2025-12-30)
- **Sidebar Layout** - Fixed sidebar with navigation, scrollable main content
- **Horizontal Stats Bar** - Compact stat chips at top of content area
- **Sidebar Navigation** - Listings, Offers, Sales, Messages tabs
- **Quick Actions Footer** - Earnings, rating, trust level in sidebar footer
- **URL Tab Sync** - `?tab=` parameter for deep linking to specific tabs
- **Action Required Section** - Priority-sorted items with inline accept/decline
- **Tabbed Content** - Quick access to listings, offers, and sales
- **Stripe Onboarding Banner** - Prompts to complete payment setup
- **Mobile Responsive** - Drawer overlay on mobile, collapsed on tablet, full on desktop

### Dashboard Layout
```
+------------------+------------------------------------------------+
|  SIDEBAR (240px) |  MAIN CONTENT                                  |
|                  |                                                |
|  [Dashboard]     |  HORIZONTAL STATS BAR                          |
|                  |  [Active] [Offers] [Action] [Messages]         |
|  NAVIGATION      |                                                |
|  > Listings      |  STRIPE BANNER (if needed)                     |
|  > Offers        |                                                |
|  > Sales         |  ACTION REQUIRED SECTION                       |
|  > Messages      |                                                |
|                  |  TABBED CONTENT                                |
|  QUICK ACTIONS   |  [Listings | Offers | Sales]                   |
|  $1,234 earned   |                                                |
|  4.8★ rating     |  [Content Grid]                                |
|  [+ New Listing] |                                                |
+------------------+------------------------------------------------+
```

### New Route (Phase 7)
| Route | Purpose |
|-------|---------|
| `/marketplace/dashboard` | Unified seller dashboard |
| `/marketplace/dashboard?tab=listings` | Deep link to listings tab |
| `/marketplace/dashboard?tab=offers` | Deep link to offers tab |
| `/marketplace/dashboard?tab=sales` | Deep link to sales tab |
| `/marketplace/dashboard?tab=messages` | Deep link to messages tab |

### New Components (Phase 7)
```
src/components/marketplace/dashboard/
├── DashboardSidebar.tsx        # Sidebar container with nav + footer
├── SidebarNav.tsx              # Tab navigation (listings/offers/sales/messages)
├── SidebarQuickActions.tsx     # Earnings, rating, trust level, new listing button
├── HorizontalStats.tsx         # Compact stat chips for top of content
├── MobileMenuTrigger.tsx       # Hamburger button with action badge
├── StripeOnboardingBanner.tsx  # Payment setup prompt
├── ActionRequiredItem.tsx      # Single action item with CTA
├── ActionRequiredSection.tsx   # Priority items section
├── DashboardTabs.tsx           # Tabbed listings/offers/sales content
├── DashboardStatCard.tsx       # Legacy stat card (kept for compatibility)
├── DashboardStatsGrid.tsx      # Legacy 6-card grid (kept for compatibility)
├── QuickActionsPanel.tsx       # Legacy nav shortcuts (kept for compatibility)
└── index.ts                    # Barrel exports
```

### New Files (Phase 7)
| File | Purpose |
|------|---------|
| `src/lib/supabase/dashboard-queries.ts` | Consolidated dashboard data fetch |
| `src/app/marketplace/dashboard/page.tsx` | Server component |
| `src/app/marketplace/dashboard/SellerDashboardClient.tsx` | Client component |
| `src/app/marketplace/dashboard/loading.tsx` | Loading skeleton |
| `src/types/marketplace.ts` | Added dashboard types |

---

## Phase 26: Marketplace Phase 6 - Discovery & Alerts (COMPLETE)

Built saved searches, wishlist alerts, and similar listings recommendations.

### Phase 6: Discovery & Alerts (2025-12-30)
- **Saved Searches** - Save marketplace search criteria with customizable alert settings
- **Alert Notifications** - Instant, daily, or weekly digest alerts for matching listings
- **Wishlist Alerts** - Price drop/availability notifications for games on wishlist
- **Similar Listings** - "You Might Also Like" recommendations on listing detail pages
- **Verified Seller Badge** - Trust level badges for high-reputation sellers
- **Saved Searches Page** - Manage saved searches at `/marketplace/saved-searches`

### New Routes (Phase 6)
| Route | Purpose |
|-------|---------|
| `/marketplace/saved-searches` | Manage saved searches and alerts |
| `/api/marketplace/saved-searches` | GET: List searches, POST: Create search |
| `/api/marketplace/saved-searches/[id]` | GET/PATCH/DELETE: Manage single search |
| `/api/marketplace/wishlist-alerts` | GET: List alerts, POST: Create alert |
| `/api/marketplace/wishlist-alerts/[id]` | GET/PATCH/DELETE: Manage single alert |
| `/api/marketplace/listings/[id]/similar` | GET: Similar listings recommendations |

### New Components (Phase 6)
```
src/components/marketplace/discovery/
├── SavedSearchCard.tsx      # Saved search display with actions
├── SaveSearchButton.tsx     # Save current search dialog
├── WishlistAlertToggle.tsx  # Enable/configure wishlist alerts
├── SimilarListings.tsx      # Similar listings grid
├── VerifiedSellerBadge.tsx  # Trust level badge component
└── index.ts                 # Barrel exports
```

### New Files (Phase 6)
| File | Purpose |
|------|---------|
| `src/lib/supabase/discovery-queries.ts` | Saved search + alert queries |
| `src/lib/config/marketplace-constants.ts` | Added `SAVED_SEARCH_SETTINGS`, `WISHLIST_ALERT_SETTINGS`, `SIMILAR_LISTINGS_SETTINGS` |
| `src/types/marketplace.ts` | Added discovery/alert types |

### Database Migration: `00045_marketplace_discovery.sql`
- `alert_frequency` enum: instant, daily, weekly
- `alert_status` enum: active, paused, expired
- `saved_searches` table with filters JSONB, alert preferences
- `wishlist_alerts` table with price threshold, condition preferences
- `alert_notifications` table for tracking sent notifications
- RLS policies (user-only access)
- Helper functions: `upsert_saved_search()`, `upsert_wishlist_alert()`, `find_matching_saved_searches()`, `find_matching_wishlist_alerts()`, `get_similar_listings()`
- Triggers: Auto-notify on matching listing published, notification types added

---

## Phase 25: Marketplace Phase 5 - Reputation & Feedback (COMPLETE)

Built seller/buyer rating and feedback system for completed marketplace transactions.

### Phase 5: Reputation & Feedback (2025-12-30)
- **Feedback System** - 1-5 star ratings with optional comments for completed transactions
- **Trust Levels** - new, established, trusted, top_seller (auto-calculated)
- **Reputation Stats** - Materialized view for aggregated seller/buyer ratings
- **Transaction Feedback** - Leave feedback form on completed transaction page
- **Seller Rating Display** - Rating/trust badge on listing detail pages
- **Profile Integration** - Marketplace reputation section on user profiles

### New Routes (Phase 5)
| Route | Purpose |
|-------|---------|
| `/api/marketplace/feedback` | GET: List feedback, POST: Leave feedback |
| `/api/marketplace/feedback/[transactionId]` | GET: Feedback for a transaction |
| `/api/marketplace/reputation/[userId]` | GET: User reputation stats + recent feedback |

### New Components (Phase 5)
```
src/components/marketplace/feedback/
├── FeedbackCard.tsx         # Individual feedback display
├── ReputationBadge.tsx      # Trust level badge with tooltip
├── SellerRating.tsx         # Seller reputation display (inline/card variants)
├── TransactionFeedback.tsx  # Leave feedback form
└── index.ts                 # Barrel exports

src/components/profile/
└── ProfileMarketplaceFeedback.tsx  # Marketplace rep on user profile
```

### Database Migration: `00044_marketplace_feedback.sql`
- `feedback_role` enum: buyer, seller
- `trust_level` enum: new, established, trusted, top_seller
- `marketplace_feedback` table with rating, comment, transaction link
- `seller_reputation_stats` materialized view for aggregated stats
- RLS policies (public read, participant write)
- Helper functions: `leave_feedback()`, `get_user_feedback()`, `get_user_reputation()`, `can_leave_feedback()`
- Triggers: Create notification on feedback, update marketplace settings rating

---

## Phase 24: Marketplace Phase 4 - Payment Processing (COMPLETE)

Built Stripe Connect payment processing for marketplace transactions.

### Phase 4: Stripe Connect Integration (2025-12-30)
- **Stripe SDK Setup** - Server-side client with lazy loading for build compatibility
- **Connect Onboarding** - Express accounts for sellers with OAuth flow
- **Checkout Sessions** - Stripe-hosted checkout for secure payments
- **Destination Charges** - Platform collects payment, transfers to sellers
- **Fee Calculation** - 3% platform fee + 2.9% + $0.30 Stripe fees
- **Webhook Handler** - Handles payment, transfer, refund, and account events
- **Transaction Dashboard** - `/marketplace/transactions` with Purchases/Sales tabs
- **Settings Integration** - Payments section in `/settings` for seller onboarding

### New Routes (Phase 4)
| Route | Purpose |
|-------|---------|
| `/marketplace/transactions` | Transaction dashboard (purchases + sales) |
| `/marketplace/transactions/[id]` | Transaction detail page |
| `/api/marketplace/stripe/connect` | Create/get Connect account |
| `/api/marketplace/stripe/connect/callback` | OAuth return handler |
| `/api/marketplace/stripe/connect/refresh` | Refresh onboarding link |
| `/api/marketplace/transactions` | GET: List transactions, POST: Create from offer |
| `/api/marketplace/transactions/[id]` | GET: Details, PATCH: Update shipping/status |
| `/api/marketplace/transactions/[id]/checkout` | POST: Create checkout session |
| `/api/stripe/webhooks` | Handle Stripe webhook events |

### New Components (Phase 4)
```
src/components/marketplace/transactions/
├── StripeConnectButton.tsx  # Onboarding status + setup button
├── CheckoutButton.tsx       # Create checkout session
├── TransactionCard.tsx      # Transaction display with actions
├── TransactionTimeline.tsx  # Visual status progression
├── ShippingForm.tsx         # Add tracking info
└── index.ts                 # Barrel exports
```

### New Stripe Files (Phase 4)
```
src/lib/stripe/
├── client.ts   # Lazy-loaded Stripe client + fee calculations
├── connect.ts  # Connect account + payment helpers
└── index.ts    # Barrel exports
```

### Database Migration: `00043_marketplace_transactions.sql`
- `transaction_status` enum (10 states: pending_payment → completed/disputed)
- `shipping_carrier` enum (USPS, UPS, FedEx, DHL, Other)
- `marketplace_transactions` table with full payment tracking
- RLS policies for buyer/seller access
- Helper functions: `create_transaction_from_offer()`, `mark_transaction_paid()`, `ship_transaction()`, `confirm_delivery()`, `release_transaction_funds()`, `request_refund()`
- Triggers: Create notification on transaction created, shipped, delivered

---

## Phase 23: Marketplace Phase 3 - Offers & Negotiation (COMPLETE)

Built structured offer system for price negotiation and trades.

### Phase 3: Offers System (2025-12-30)
- **Database Schema** - `marketplace_offers` table with full state machine (pending → accepted/declined/countered/expired/withdrawn)
- **Offer Types** - buy, trade, buy_plus_trade with validation
- **Counter-Offer Chains** - via `parent_offer_id` with counter limit
- **48-Hour Expiration** - Default expiry with auto-expire function
- **Offer Queries** - `src/lib/supabase/offer-queries.ts` with CRUD + RPC calls
- **Offers Dashboard** - `/marketplace/offers` with Received/Sent tabs
- **Make Offer Button** - Integrated into listing detail page for listings that accept offers
- **Trade Selector** - Select games from shelf to offer in trades

### New Routes (Phase 3)
| Route | Purpose |
|-------|---------|
| `/marketplace/offers` | Offers dashboard (received + sent tabs) |
| `/api/marketplace/offers` | GET: List offers, POST: Create offer |
| `/api/marketplace/offers/[id]` | GET: Offer details, PATCH: Accept/decline/counter/withdraw |
| `/api/user/shelf` | GET: User's shelf items (for trade selector) |

### New Components (Phase 3)
```
src/components/marketplace/offers/
├── MakeOfferDialog.tsx    # Modal with offer type, amount, trade games, message
├── OfferCard.tsx          # Offer display with accept/decline/counter/withdraw actions
├── TradeSelector.tsx      # Select owned games from shelf to offer in trade
└── index.ts               # Barrel exports
```

### Database Migration: `00042_marketplace_offers.sql`
- `offer_type` enum: buy, trade, buy_plus_trade
- `offer_status` enum: pending, accepted, declined, countered, expired, withdrawn
- `marketplace_offers` table with constraints for valid offers
- RLS policies for buyer/seller access
- Helper functions: `accept_offer()`, `decline_offer()`, `counter_offer()`, `withdraw_offer()`
- Triggers: Create notification on new offer, notification on status change
- Auto-decline other offers when one is accepted

---

## Phase 22: Marketplace Phase 2 - Messaging (COMPLETE)

Built in-app messaging system for buyer/seller communication.

### Phase 2: Messaging System (2025-12-30)
- **Database Schema** - `marketplace_conversations`, `marketplace_messages` tables
- **Conversation Queries** - `src/lib/supabase/conversation-queries.ts` with full CRUD
- **Messages Inbox** - `/marketplace/messages` with unread badges, conversation list
- **Conversation Thread** - `/marketplace/messages/[id]` with real-time messaging UI
- **Contact Seller Button** - Integrated into listing detail page, creates/opens conversations
- **Header Navigation** - Added "Marketplace" link to main header

### New Routes (Phase 2)
| Route | Purpose |
|-------|---------|
| `/marketplace/messages` | Messages inbox page |
| `/marketplace/messages/[id]` | Conversation thread page |
| `/api/marketplace/conversations` | GET: List conversations, POST: Create new |
| `/api/marketplace/conversations/[id]` | GET: Conversation with messages, PATCH: Archive/mark read |
| `/api/marketplace/conversations/[id]/messages` | POST: Send message |

### New Components (Phase 2)
```
src/components/marketplace/messaging/
├── ConversationList.tsx      # Inbox list with unread badges
├── MessageThread.tsx         # Message display + send UI
├── ContactSellerButton.tsx   # Start conversation from listing
└── index.ts                  # Barrel exports
```

### Database Migration: `00041_marketplace_messaging.sql`
- `marketplace_conversations` - Threads (listing_id, buyer_id, seller_id, unread counts, archive flags)
- `marketplace_messages` - Individual messages (content, is_read, is_system_message)
- Triggers: Auto-update conversation on new message, create notification on new message
- RPC functions: `get_or_create_conversation`, `mark_conversation_read`

---

## Phase 21: Marketplace Phase 1 - Foundation & Listings (COMPLETE)

Built the foundation for a Buy/Sell/Trade marketplace competing with BGG's marketplace on UX.

### Phase 0: Foundation (2025-12-30)
- **Feature Flags** - System for gradual rollout (`feature_flags` table)
- **Marketplace Constants** - Fee structures, limits, durations
- **TypeScript Types** - Full type definitions for marketplace entities

### Phase 1: Listing System (2025-12-30)
- **Database Schema** - `marketplace_listings`, `listing_images`, `listing_saves`, `user_marketplace_settings`
- **Browse Page** - `/marketplace` with filter sidebar, grid layout, pagination
- **Create Listing Wizard** - 4-step flow (Select Game → Details → Pricing & Shipping → Photos)
- **Listing Detail Page** - `/marketplace/listings/[id]` with images, seller info, condition, actions
- **My Listings Dashboard** - `/marketplace/my-listings` with tabs (Active, Drafts, Pending, Sold, Expired)
- **Edit Listing Page** - `/marketplace/listings/[id]/edit` with details + photos tabs
- **Photo Uploads** - Drag-drop image upload with primary selection, up to 6 photos per listing
- **Game Search API** - `/api/games/search` for game selector component

### Database Migrations (Phase 0-1)
| Migration | Description |
|-----------|-------------|
| `00039_marketplace_foundation.sql` | Feature flags table |
| `00040_marketplace_listings.sql` | Listings, images, saves, settings tables + enums |

### Enum Types Created
```sql
listing_type: 'sell' | 'trade' | 'want'
listing_status: 'draft' | 'active' | 'pending' | 'sold' | 'traded' | 'expired' | 'cancelled'
game_condition: 'new_sealed' | 'like_new' | 'very_good' | 'good' | 'acceptable'
shipping_preference: 'local_only' | 'will_ship' | 'ship_only'
```

### New Routes
| Route | Purpose |
|-------|---------|
| `/marketplace` | Browse all listings |
| `/marketplace/listings/new` | Create listing wizard |
| `/marketplace/listings/[id]` | Listing detail page |
| `/marketplace/my-listings` | User's listings dashboard |
| `/api/marketplace/listings` | POST: Create listing |
| `/api/marketplace/listings/[id]` | GET/PATCH/DELETE listing |
| `/api/marketplace/listings/[id]/save` | POST/DELETE: Save/unsave |
| `/api/marketplace/listings/[id]/saved` | GET: Check if saved |
| `/api/games/search` | Game search for selector |

### New Components
```
src/components/marketplace/
├── ListingCard.tsx           # Grid card with image, price, condition
├── ListingGrid.tsx           # Responsive grid layout
├── ConditionBadge.tsx        # Color-coded condition indicator
├── CreateListingWizard.tsx   # 3-step create flow
├── filters/
│   ├── MarketplaceFilterSidebar.tsx
│   ├── MobileMarketplaceFilters.tsx
│   └── index.ts
└── forms/
    ├── GameSelector.tsx      # Game search + selection
    ├── ListingDetailsForm.tsx # Type, condition, description
    ├── PricingForm.tsx       # Price, shipping, location
    └── index.ts
```

### New UI Components
- `src/components/ui/checkbox.tsx` - Radix checkbox
- `src/components/ui/radio-group.tsx` - Radix radio group
- `src/components/ui/alert-dialog.tsx` - Confirmation dialogs
- `src/components/ui/avatar.tsx` - User avatars

### Key Files
| File | Purpose |
|------|---------|
| `src/lib/config/marketplace-constants.ts` | Fees, limits, durations |
| `src/types/marketplace.ts` | All marketplace TypeScript types |
| `src/lib/config/feature-flags.ts` | Feature flag utilities |
| `src/lib/supabase/listing-queries.ts` | Listing CRUD operations |
| `src/hooks/use-debounce.ts` | Debounce hook for search |
