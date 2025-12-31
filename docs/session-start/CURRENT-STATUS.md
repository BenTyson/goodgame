# Current Status

> Last Updated: 2025-12-31 (Marketplace Sidebar Unification - COMPLETE)

## Phase: 28 - Marketplace UI/UX Unification (COMPLETE)

Unified marketplace page layout to match the seller dashboard sidebar pattern.

### Marketplace Sidebar Unification (2025-12-31) ✅
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

## Phase: 27 - Marketplace Phase 7: Seller Dashboard V2 (COMPLETE)

Built unified seller dashboard with sidebar layout (Faire-inspired).

### Phase 7: Seller Dashboard V2 (2025-12-30) ✅
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

## Phase: 26 - Marketplace Phase 6: Discovery & Alerts (COMPLETE)

Built saved searches, wishlist alerts, and similar listings recommendations.

### Phase 6: Discovery & Alerts (2025-12-30) ✅
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

## Phase: 25 - Marketplace Phase 5: Reputation & Feedback (COMPLETE)

Built seller/buyer rating and feedback system for completed marketplace transactions.

### Phase 5: Reputation & Feedback (2025-12-30) ✅
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

### New Files (Phase 5)
| File | Purpose |
|------|---------|
| `src/lib/supabase/feedback-queries.ts` | Feedback CRUD + reputation queries |
| `src/lib/config/marketplace-constants.ts` | Added `FEEDBACK_SETTINGS` |
| `src/types/marketplace.ts` | Added feedback/reputation types |

### Database Migration: `00044_marketplace_feedback.sql`
- `feedback_role` enum: buyer, seller
- `trust_level` enum: new, established, trusted, top_seller
- `marketplace_feedback` table with rating, comment, transaction link
- `seller_reputation_stats` materialized view for aggregated stats
- RLS policies (public read, participant write)
- Helper functions: `leave_feedback()`, `get_user_feedback()`, `get_user_reputation()`, `can_leave_feedback()`
- Triggers: Create notification on feedback, update marketplace settings rating

---

## Phase: 24 - Marketplace Phase 4: Payment Processing (COMPLETE)

Built Stripe Connect payment processing for marketplace transactions.

### Phase 4: Stripe Connect Integration (2025-12-30) ✅
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

## Phase: 23 - Marketplace Phase 3: Offers & Negotiation (COMPLETE)

Built structured offer system for price negotiation and trades.

### Phase 3: Offers System (2025-12-30) ✅
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

## Phase: 22 - Marketplace Phase 2: Messaging (COMPLETE)

Built in-app messaging system for buyer/seller communication.

### Phase 2: Messaging System (2025-12-30) ✅
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

## Phase: 21 - Marketplace Phase 1 (COMPLETE)

Built the foundation for a Buy/Sell/Trade marketplace competing with BGG's marketplace on UX.

### Phase 0: Foundation (2025-12-30) ✅
- **Feature Flags** - System for gradual rollout (`feature_flags` table)
- **Marketplace Constants** - Fee structures, limits, durations
- **TypeScript Types** - Full type definitions for marketplace entities

### Phase 1: Listing System (2025-12-30) ✅
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

### Future Phases (Not Yet Built)
- Phase 5: Reputation & Feedback
- Phase 6: Discovery & Alerts

---

## Phase: 20 - Categories Page Update (COMPLETE)

Updated `/categories` page from hardcoded mock data to database-driven with UI polish.

### Changes (2025-12-29) ✅
- **Database-driven** - Fetches categories from Supabase via `getCategoriesWithGameCounts()`
- **Game counts** - Shows actual published game count per category from junction table
- **Links to filters** - Category cards now link to `/games?categories={slug}` (uses Filter UI V2)
- **Dynamic icons** - Maps DB `icon` field to Lucide components with fallback
- **UI polish** - Card shadows, hover states, consistent styling with GameCard
- **Empty state** - Graceful handling when no categories exist

### Files Modified
| File | Change |
|------|--------|
| `src/lib/supabase/category-queries.ts` | Added `getCategoriesWithGameCounts()` |
| `src/app/categories/page.tsx` | Rewrote to use DB fetch, new links, polished UI |

### Removed
- `mockCategories` and `mockGames` imports (no longer using hardcoded data)
- Hardcoded 5-category icon mapping (now uses DB `icon` field)

---

## Phase: 19 - Games Page Filter UI V2 (COMPLETE)

Modern filter UX redesign for `/games` page with collapsible sidebar, horizontal filter bar, and dynamic grid columns.

### Filter UI V2 Features (2025-12-29) ✅
- **Horizontal Filter Bar** - Range sliders (Players, Time, Complexity) as compact popovers above grid
- **Collapsible Sidebar Rail** - Toggle between full (256px) and icon-only rail (48px)
- **Accordion Sections** - Categories, Mechanics, Themes, Play Style with active count badges
- **Default Collapsed** - Only Categories expanded by default, others collapsed
- **Active Filter Pills** - Horizontal scrollable bar showing selected filters with quick remove
- **Dynamic Grid Columns** - More columns when sidebar collapsed (3→4 on lg, 4→5 on xl)
- **Wider Container** - `max-w-[1600px]` for more game real estate
- **State Persistence** - Sidebar collapsed/expanded and accordion states saved to localStorage
- **Mobile Sheet** - Full filter drawer with accordions on mobile

### Game Card Cleanup (2025-12-29) ✅
- Removed redundant content badges from bottom of cards (Rules, Score, Setup, Ref)
- Kept hover-only quick action badges, made smaller (text-[11px], h-3 w-3 icons)
- Saves significant vertical space per card

### New Files Created
```
src/components/games/filters/
├── index.ts              # Barrel exports
├── types.ts              # Filter types (TaxonomyType, RangeType, etc.)
├── constants.ts          # Icons, labels, defaults per section
├── FilterBar.tsx         # Horizontal range filter popovers
├── FilterSidebar.tsx     # Main collapsible sidebar container
├── FilterRail.tsx        # Collapsed icon-only rail (48px)
├── FilterSection.tsx     # Accordion wrapper using Collapsible
├── TaxonomyBadges.tsx    # Badge grid for taxonomy selection
├── RangeFilterPopover.tsx # Popover with slider
├── ActiveFilters.tsx     # Horizontal pill bar
└── MobileFilterSheet.tsx # Mobile drawer with all filters

src/hooks/
└── use-local-storage.ts  # SSR-safe localStorage hook

src/app/games/
└── GamesPageClient.tsx   # Client component for filter state
```

### UI Components Added
- `src/components/ui/collapsible.tsx` (via shadcn)
- `src/components/ui/popover.tsx` (via shadcn)

---

## Phase: 18 - Taxonomy Management System (COMPLETE)

Full faceted classification system with 5 taxonomy types, admin UI, BGG import compatibility, and recommendation engine integration.

### Phase 1: Mechanics Filtering Fix (2025-12-29) ✅
- Removed hardcoded `mockMechanics` from `/games` page
- Mechanics now fetched from database via `getMechanics()`
- Implemented mechanics filtering in `getFilteredGames()`

### Phase 2: Admin Taxonomy UI (2025-12-29) ✅
- `/admin/taxonomy` - Overview dashboard with stats for all 5 taxonomy types
- Full CRUD for Categories, Mechanics, Themes, Player Experiences
- Complexity Tiers view (auto-assigned based on weight)
- `TaxonomyEditor.tsx` shared component

### Phase 3: Themes Table (2025-12-29) ✅
New taxonomy facet for game settings/worlds:
- **15 themes**: fantasy, sci-fi, historical, horror, nature, mythology, mystery, war, economic, pirates, medieval, post-apocalyptic, abstract, humor, steampunk
- Admin UI at `/admin/taxonomy/themes`
- Junction table `game_themes` with `is_primary` flag

### Phase 4: Player Experiences Table (2025-12-29) ✅
New taxonomy facet for how players interact:
- **8 experiences**: competitive, cooperative, team-based, solo, social, narrative, asymmetric, hidden-roles
- Admin UI at `/admin/taxonomy/player-experiences`
- Junction table `game_player_experiences` with `is_primary` flag

### Phase 5: Complexity Tiers Table (2025-12-29) ✅
Weight-based game classifications:
- **5 tiers**: gateway (1.0-1.8), family (1.8-2.5), medium (2.5-3.2), heavy (3.2-4.0), expert (4.0-5.0)
- Auto-assigned during BGG import based on weight
- `complexity_tier_id` column added to games table
- Read-only admin view at `/admin/taxonomy/complexity`

### Phase 6: BGG Alias System (2025-12-29) ✅
Robust mapping for BGG imports:
- `bgg_tag_aliases` table maps BGG IDs to internal taxonomy
- Supports category→theme, category→player_experience mappings
- Importer uses alias system with name-based fallback
- ~50 initial aliases seeded

### Phase 7: Recommendation Engine Integration (2025-12-29) ✅
Enhanced scoring algorithm:
- **New scoring distribution** (100 points total):
  - Player count: 20 pts
  - Play time: 10 pts
  - Weight/complexity: 15 pts
  - Categories: 10 pts
  - **Themes: 15 pts** (uses actual game themes)
  - **Player experiences: 10 pts** (new!)
  - Mechanics: 5 pts
  - Curated flags: 15 pts
- `preferredExperiences` added to RecommendationSignals
- API fetches themes/experiences for candidate games

### Phase 8: Data Migration (2025-12-29) ✅
Backfilled 35 existing games:
- Created migration script `scripts/migrate-from-categories.ts`
- Inferred themes/experiences from existing category links
- **33 theme links** and **43 experience links** added

### Admin Games Page Redesign (2025-12-29)
- Compact card grid (image + name only)
- Whole card clickable to edit screen
- 5-column layout on xl screens
- Removed View/Edit buttons

---

## Phase: 17 - Game Recommendation Engine (COMPLETE)

### Game Recommendation Engine (2025-12-28)
Smart wizard that asks adaptive questions and recommends personalized games:

**Wizard Flow (5 questions):**
1. **Who are you playing with?** (Scenario cards) - Solo / Partner / Small group / Party
2. **How much time do you have?** (Slider with Continue button) - Quick / Standard / Long / Epic
3. **What's your experience level?** (Scenario cards) - New / Casual / Experienced / Hardcore
4. **What experience are you looking for?** (Scenario cards) - Competitive / Cooperative / Strategic / Social / Narrative
5. **What world draws you in?** (Scenario cards) - Swords & Sorcery / Stars & Cosmos / Empires & Ages / Mystery & Shadows / Hearth & Harvest / Surprise Me

**Smart Adaptations:**
- Theme question skipped for "Social" experience type (party games are theme-light)
- Auto-sets theme to "surprise-me" when skipped

**Algorithm:**
- Phase 1: Hard filters (player count, time, weight constraints)
- Phase 2: Soft scoring (0-100 points based on category, theme, mechanics, curated flags)
- Phase 3: AI ranking with Claude for final top 3 + personalized explanations
- Fallback: Template-based personalization when AI unavailable

**Gamer Archetypes (revealed after questions):**
- The Strategist (Brain icon) - Heavy weight, competitive, strategy
- The Social Butterfly (Users icon) - Party games, 5+ players
- The Team Player (Handshake icon) - Cooperative, campaign games
- The Storyteller (BookOpen icon) - Thematic, adventure, narrative
- The Quick Draw (Zap icon) - Short play time, light weight
- The Curator (Gem icon) - Staff picks, hidden gems

**Results Page:**
- Archetype reveal with animation
- Top 3 recommendations with personalized "Why you'll love this" text
- "Also Consider" section with 4 additional game thumbnails
- "Start Over" button for refinement

**Personalized Text Generation:**
- Theme-based phrases (e.g., "Takes you into an epic fantasy world")
- Experience-type reasons (e.g., "Strategic depth will keep you thinking")
- Player count fit (e.g., "Plays excellently at 2 players")
- Complexity match (e.g., "Approachable enough to learn quickly")
- Curated flag callouts (e.g., "Staff favorite here at Board Nomads")
- Dynamic "Perfect for" text combining user preferences

**Navigation:**
- Featured "Recommend" button in header (pill style, primary color)
- Homepage CTA sections
- Progress bar during questions
- Back button for question navigation

**Files Created:**
- `src/app/recommend/page.tsx` - Entry point
- `src/app/recommend/RecommendWizard.tsx` - Main wizard component
- `src/app/api/recommendations/route.ts` - API endpoint
- `src/lib/recommend/types.ts` - TypeScript types
- `src/lib/recommend/scoring.ts` - Game scoring algorithm
- `src/lib/recommend/archetypes.ts` - Archetype definitions
- `src/lib/recommend/prompts.ts` - AI prompts + template personalization
- `src/components/recommend/` - 7 UI components (WizardContainer, WelcomeStep, ScenarioCards, SliderQuestion, ArchetypeReveal, RecommendationResults, index)

### Profile V3 Redesign (2025-12-28)
Modern Airbnb-inspired card-based layout:
- **Two-column layout**: Sticky identity card on left, scrollable content on right
- **No banner image**: Clean card-based design
- **Hero Stats**: Big number cards (Games, Avg Rating, Followers, Reviews)
- **Section order**: Shelf (top, prominent), Top Games, Stats, Insights, Reviews, Mutual Games
- **Top 10 Games**: Gold/silver/bronze rings with subtle glow for positions 1-3
- **New components** (modular architecture):
  - `ProfileIdentityCard` - Avatar, name, bio, social links, follow button
  - `ProfileHeroStats` - Big stat cards with achievement badges
  - `ProfileShelfGrid` - Game collection with filter tabs
  - `ProfileInsights` - Collection breakdown, player count preferences
  - `ProfileReviews` - User's written reviews showcase
  - `MutualGamesSection` - "Games You Both Have" social discovery
- **New queries**:
  - `getMutualGames()` - Games both users have in common
  - `getUserReviews()` - User's reviews for profile display
  - `getUserReviewCount()` - Total review count
- **ProfileContent.tsx** refactored from 567 lines to ~145 lines (composition)

### Settings Page Cleanup (2025-12-28)
- Removed header/banner image upload (profile no longer uses banner)
- Avatar upload constrained to appropriate size (max-w-xs)
- Added "View Profile" button for quick navigation back to profile

### Admin Dashboard V2 (2025-12-28)
- Clean monochromatic design (teal primary + muted grays)
- Removed rainbow of colors (green/yellow/blue/purple/orange)
- Stat cards with larger icons and progress bar for published %
- Pipeline status cards with 3-column grid layout
- Recent games list with actual game thumbnails and "Added" date
- Uses Badge component with default/outline variants for status

### Security & Maintenance (2025-12-28)
- Fixed open redirect vulnerability in auth callback
- Added timing-safe CRON_SECRET comparison
- Added magic byte validation for file uploads (prevents MIME spoofing)
- Removed SVG upload support (XSS risk)
- Created secure file upload utility (`src/lib/upload/validation.ts`)
- Updated `.env.example` with all required variables
- Fixed site URL inconsistency (robots.ts used wrong domain)
- Updated DATABASE.md with missing tables and migrations
- Deleted outdated GOODGAME.md planning document

### Code Organization (2025-12-28)
- Extracted shared `generateSlug()` utility to `src/lib/utils/slug.ts`
- Consolidated admin auth (`createAdminClient`, `isAdmin`) in `src/lib/supabase/admin.ts`
- Updated all 6 admin API routes to use shared admin utilities
- Split `queries.ts` (1,609 lines) into focused modules:
  - `game-queries.ts` - Games, search, filters, score sheets, stats
  - `category-queries.ts` - Categories, mechanics
  - `collection-queries.ts` - Collections
  - `award-queries.ts` - Awards, award categories, game awards
  - `entity-queries.ts` - Designers, publishers, artists
  - `family-queries.ts` - Game families, game relations
- Split `user-queries.ts` (739 lines) into focused modules:
  - `user-queries.ts` - Core profile, shelf, top games (re-exports others)
  - `social-queries.ts` - Follow/unfollow, followers/following
  - `review-queries.ts` - Game reviews, aggregate ratings
- Added security headers to middleware:
  - X-Frame-Options: DENY (clickjacking protection)
  - X-Content-Type-Options: nosniff (MIME sniffing protection)
  - Referrer-Policy: strict-origin-when-cross-origin
  - Permissions-Policy: camera=(), microphone=(), geolocation=()
- Created centralized constants file (`src/lib/config/constants.ts`)
  - Filter defaults, pagination sizes, upload limits, BGG API settings
- Consolidated social media icons to `src/components/icons/social.tsx`
  - Shared XIcon, InstagramIcon, DiscordIcon, BGGIcon components
- Created API error utilities (`src/lib/api/errors.ts`)
  - Sanitized error responses (no internal details leaked to clients)
  - Server-side error logging with context
  - Updated all 9 API routes to use sanitized errors
- Extracted BGG category mapping to `src/lib/config/bgg-mappings.ts`
- Added rate limiting (`src/lib/api/rate-limit.ts`)
  - Admin APIs: 60 requests/minute
  - File uploads: 20 requests/minute
  - Cron endpoints: 1 request/minute (prevent duplicate runs)
  - Returns 429 with Retry-After headers when limited

### What's Live
- **35 games** (16 with full content + 19 BGG top 20 games pending content)
- **11 major awards** with full UI (American, German, International)
- **Admin panel** at `/admin` with Google OAuth
- **Image uploads** via Supabase Storage
- **Content pipeline** (BGG scraper + AI generation ready)
- **Separate databases** for staging and production
- **User authentication** with Google OAuth
- **Your Shelf** feature - track games you own/want (in main nav)
- **Shelf v2 UI** - Card grid layout with tab filters and clickable ratings
- **User profiles** - username, bio, location, social links
- **Public profile pages** at `/u/[username]`
- **Privacy controls** - profile/shelf visibility (both default to public)
- **Normalized entities** - Designers, Publishers, Artists as proper tables
- **Entity pages** - `/designers`, `/publishers` with game listings
- **Game Families** - Series groupings (Catan, Pandemic, etc.) with public pages
- **Game Relations** - Expansions, sequels, reimplementations linked between games
- **Auto-import** - Families and expansion relations from BGG during import
- **Publisher Admin** - Full CRUD with logo upload at `/admin/publishers`
- **Publisher Filters** - A-Z alphabetical, category type, and sort options on `/publishers`
- **Featured Game** - Homepage section with hero image and game details
- **Streamlined Nav** - Removed redundant Rules/Score Sheets links (pages still exist for SEO)
- **Game Keytags** - Trending, Top Rated, Staff Pick, Hidden Gem, New Release (admin toggles)
- **Top 10 Games** - Users can curate their all-time favorite games on profiles
- **Custom Avatars** - Override Google OAuth avatar with custom upload
- **Collection Insights** - Stats showing ratings, player count preferences
- **Last Active** - Shows when user was last active
- **Profile Badges** - Admin role badge, Collector 50+/100+, Rater badges
- **Following System** - Follow/unfollow users, followers/following lists
- **Activity Feed** - See activities from followed users at `/feed`
- **Notifications** - Bell icon in header, new follower notifications
- **Game Reviews** - Write reviews on games (requires game on shelf), aggregate ratings on game pages
- **Game Recommendation Engine** - Smart wizard at `/recommend` with personalized game suggestions
- **Games Page Filter V2** - Collapsible sidebar rail, horizontal filter bar, dynamic grid columns
- **Marketplace Phase 1-8** - Full marketplace with listings, messaging, offers, Stripe payments, seller reputation, saved searches, wishlist alerts, seller dashboard V2 (sidebar layout), and unified browse/dashboard UI

### Environments & Branches

See `QUICK-REFERENCE.md` for full environment/URL/Supabase reference.

| Branch | Deploys To |
|--------|------------|
| `develop` | Staging |
| `main` | Production |

### User Auth & Shelf
| Feature | Status |
|---------|--------|
| Google OAuth login | ✅ |
| User profile auto-creation | ✅ |
| Add games to shelf | ✅ |
| Shelf statuses (owned, want to buy, want to play, wishlist, previously owned) | ✅ |
| Game ratings (1-10) | ✅ |
| Shelf tab filters (by status) | ✅ |
| Shelf card grid layout (4 cols) | ✅ |
| Shelf sorting (added, name, rating) | ✅ |
| Profile settings page | ✅ |
| Unique usernames (@username) | ✅ |
| Bio, location fields | ✅ |
| Social links (BGG, Twitter, Instagram, Discord, Website) | ✅ |
| Public profile pages | ✅ |
| Profile/shelf visibility controls | ✅ |
| Top 10 Games ranking | ✅ |
| Drag & drop ranking editor | ✅ |
| Custom avatar upload | ✅ |
| Collection insights/stats | ✅ |
| Last active indicator | ✅ |
| Profile badges (role, milestones) | ✅ |

### Social Features (Phase 16)
| Feature | Status |
|---------|--------|
| Follow/unfollow users | ✅ |
| Followers/following lists | ✅ |
| Follow stats on profiles | ✅ |
| Activity feed (`/feed`) | ✅ |
| Activity types (follow, shelf, rating, review, top games) | ✅ |
| Notification bell in header | ✅ |
| Unread notification count | ✅ |
| New follower notifications | ✅ |
| Mark notifications read | ✅ |
| Game reviews on shelf items | ✅ |
| Aggregate ratings on game pages | ✅ |
| Review section on game pages | ✅ |

### Marketplace Phase 6: Discovery & Alerts
| Feature | Status |
|---------|--------|
| Saved searches with filters | ✅ |
| Save current search button | ✅ |
| Saved searches management page | ✅ |
| Alert frequency (instant/daily/weekly) | ✅ |
| Pause/resume search alerts | ✅ |
| Wishlist alerts for price drops | ✅ |
| Wishlist alert configuration | ✅ |
| Similar listings recommendations | ✅ |
| "You Might Also Like" on listing detail | ✅ |
| Verified seller badges | ✅ |
| Trust level badges (new/established/trusted/top_seller) | ✅ |

### Marketplace Phase 7: Seller Dashboard V2
| Feature | Status |
|---------|--------|
| Unified dashboard at `/marketplace/dashboard` | ✅ |
| Sidebar layout (Faire-inspired) | ✅ |
| Sidebar navigation (listings/offers/sales/messages) | ✅ |
| Horizontal stats bar at top of content | ✅ |
| Quick actions in sidebar footer (earnings, rating) | ✅ |
| URL tab sync (`?tab=` parameter) | ✅ |
| Action required section with priority sorting | ✅ |
| Inline offer accept/decline | ✅ |
| Tabbed content (listings/offers/sales) | ✅ |
| Stripe onboarding banner | ✅ |
| Mobile drawer overlay | ✅ |
| Loading skeleton | ✅ |

### Marketplace Phase 8: UI/UX Unification
| Feature | Status |
|---------|--------|
| Marketplace page sidebar layout | ✅ |
| MarketplaceSidebar component | ✅ |
| Embedded filter mode | ✅ |
| Quick links to dashboard tabs | ✅ |
| Dashboard deep linking (`?tab=`) | ✅ |
| Mobile header with filter badge | ✅ |
| Loading skeleton for sidebar layout | ✅ |

### Game Recommendation Engine (Phase 17)
| Feature | Status |
|---------|--------|
| Wizard UI at `/recommend` | ✅ |
| Player count question (scenario cards) | ✅ |
| Play time question (slider with Continue) | ✅ |
| Experience level question | ✅ |
| Experience type question | ✅ |
| Theme world question (6 options + surprise me) | ✅ |
| Adaptive skip (theme skipped for social games) | ✅ |
| Progress bar during questions | ✅ |
| Back navigation | ✅ |
| Loading animation ("Board Nomads are Wandering") | ✅ |
| Gamer archetype classification | ✅ |
| Archetype reveal animation | ✅ |
| Game scoring algorithm (0-100 points) | ✅ |
| AI ranking with Claude | ✅ |
| Template-based personalization fallback | ✅ |
| Top 3 recommendations with personalized text | ✅ |
| "Also Consider" section (4 thumbnails) | ✅ |
| "Recommend" button in header (featured style) | ✅ |
| Homepage CTA sections | ✅ |

### Games Page Filter UI V2 (Phase 19)
| Feature | Status |
|---------|--------|
| Horizontal filter bar with range popovers | ✅ |
| Collapsible sidebar rail (256px ↔ 48px) | ✅ |
| Accordion sections for taxonomies | ✅ |
| Only Categories open by default | ✅ |
| Active filter pills with remove | ✅ |
| Clear all filters button | ✅ |
| Dynamic grid columns based on sidebar | ✅ |
| Wider container (max-w-[1600px]) | ✅ |
| State persistence (localStorage) | ✅ |
| Mobile filter sheet with accordions | ✅ |
| Compact hover badges on game cards | ✅ |
| Removed redundant bottom badges | ✅ |

**Profile V3 UI (Current):**
- Two-column layout: sticky identity card on left, scrollable content on right
- No banner - clean card-based design (Airbnb-inspired)
- Identity card: large avatar, name/username, bio, location, social icons, follow button
- Hero stats: big number cards (Games, Avg Rating, Followers, Reviews)
- Section order: Shelf (prominent), Top Games, Stats, Insights, Reviews, Mutual Games
- Top 10 games: gold/silver/bronze rings with subtle glow for top 3
- Mutual games: "Games You Both Have" social discovery feature
- Custom avatar (overrides Google profile picture)
- Last active timestamp with relative time display
- Badges: Admin role, Collector 50+/100+, Rater (25+ ratings)

**Top 10 Games:**
- Curate favorite games (any game in database)
- Drag & drop reordering in modal editor
- Horizontal strip display (uniform cards, primary color badges)
- Search UI at top of modal (sticky, visible on all screen sizes)
- Visibility follows profile settings

**Shelf Status Icons (Lucide):**
- Owned: `Package`
- Want to Buy: `ShoppingCart`
- Want to Play: `Dices`
- Wishlist: `Star`
- Previously Owned: `ArchiveX`

**Routes:**
- `/login` - User login page
- `/shelf` - Your game collection (card grid with tab filters)
- `/settings` - Profile settings (username, bio, location, social links, privacy)
- `/u/[username]` - Public user profile page
- `/u/[username]/followers` - Followers list
- `/u/[username]/following` - Following list
- `/feed` - Activity feed (from followed users)
- `/recommend` - Game recommendation wizard

### Admin System (`/admin`)
| Feature | Status |
|---------|--------|
| Google OAuth login | ✅ |
| Magic link email login | ✅ |
| Games list with filters | ✅ |
| Game editor (metadata, content) | ✅ |
| Game keytag toggles (Publishing tab) | ✅ |
| Game relationships tab | ✅ |
| Image upload + gallery management | ✅ |
| Set primary/cover image | ✅ |
| Import queue management | ✅ |
| Family manager | ✅ |
| Publisher manager | ✅ |
| Publisher logo upload | ✅ |
| Dashboard with stats | ✅ |

**Game Keytags (boolean flags for homepage collections):**
- `is_trending` - Trending Now
- `is_top_rated` - Top Rated
- `is_staff_pick` - Staff Pick
- `is_hidden_gem` - Hidden Gem
- `is_new_release` - New Release

### Game Families & Relations
| Feature | Status |
|---------|--------|
| Family list page (`/families`) | ✅ |
| Family detail page (`/families/[slug]`) | ✅ |
| Family badge on game pages | ✅ |
| Games grouped by relation type on family page | ✅ |
| Admin family manager (`/admin/families`) | ✅ |
| Admin family editor (create/edit/delete) | ✅ |
| Game editor relationships tab | ✅ |
| BGG import auto-creates families | ✅ |
| BGG import auto-creates expansion relations | ✅ |

**Relation Types:** expansion_of, base_game_of, sequel_to, prequel_to, reimplementation_of, spin_off_of, standalone_in_series

### Publishers
| Feature | Status |
|---------|--------|
| Publisher list page (`/publishers`) | ✅ |
| Publisher detail page (`/publishers/[slug]`) | ✅ |
| Alphabetical filter (A-Z) | ✅ |
| Category type filter | ✅ |
| Sort options (name, game count) | ✅ |
| Category badges on cards | ✅ |
| Admin publisher manager (`/admin/publishers`) | ✅ |
| Admin logo upload | ✅ |

**Storage:** `publisher-logos` bucket in Supabase Storage

### Content Pipeline
| Component | Status | Location |
|-----------|--------|----------|
| BGG Scraper | ✅ | `src/lib/bgg/` |
| AI Content Generator | ✅ | `src/lib/ai/` |
| Import Cron API | ✅ | `/api/cron/import-bgg` |
| Generate Cron API | ✅ | `/api/cron/generate-content` |
| Image Upload API | ✅ | `/api/admin/upload` |

**Note:** BGG API requires registration and Bearer token. Register at https://boardgamegeek.com/applications

---

## Supabase Projects

### Staging (`ndskcbuzsmrzgnvdbofd`)
- **Used by**: localhost + Railway staging
- **Purpose**: Safe testing, can reset data
- **URL**: https://ndskcbuzsmrzgnvdbofd.supabase.co

### Production (`jnaibnwxpweahpawxycf`)
- **Used by**: Railway production only
- **Purpose**: Live user data, protected
- **URL**: https://jnaibnwxpweahpawxycf.supabase.co

---

## Environment Variables

See `.env.example` for required variables and `QUICK-REFERENCE.md` for quick setup.

**Key difference between environments:**
- Staging uses Supabase project `ndskcbuzsmrzgnvdbofd`
- Production uses Supabase project `jnaibnwxpweahpawxycf`

---

## Database Migrations
```
supabase/migrations/
├── 00001_initial_schema.sql       # Core tables
├── 00002_seed_data.sql            # Categories + mechanics
├── 00003_game_images.sql          # Images table
├── 00004_seed_games.sql           # First 6 games
├── 00005_more_pilot_games.sql     # 4 more games
├── 00006_tier1_gateway_games.sql  # 6 gateway games
├── 00007_awards_schema.sql        # Awards tables
├── 00008_seed_awards.sql          # 6 awards + winners
├── 00009_game_content.sql         # JSONB content columns
├── 00010_game_families.sql        # Game relations (expansions)
├── 00011_import_queue.sql         # BGG import queue
├── 00012_content_generation_log.sql # AI generation tracking
├── 00013_seed_existing_content.sql  # Migrate hardcoded content
├── 00014_complete_game_content.sql  # All 16 games content
├── 00015_game_images_storage.sql    # Supabase Storage bucket
├── 00016_game_images_rls.sql        # RLS for game_images
├── 00017_cleanup_placeholder_images.sql # Remove old BGG placeholders
├── 00018_queue_bgg_top100.sql       # Queue BGG Top 100 games
├── 00019_seo_collections.sql        # SEO collection pages
├── 00020_user_profiles_and_shelf.sql # User auth + shelf feature
├── 00021_normalize_entities.sql     # Designers, publishers, artists tables
├── 00022_migrate_entity_data.sql    # Populate from bgg_raw_data
├── 00023_user_profile_enhancements.sql # Username, bio, social links, visibility
├── 00024_add_awards_and_reorder.sql # 5 more awards (American/German/International)
├── 00025_bgg_top20_games.sql        # 19 BGG top 20 games
├── 00026_populate_publishers_from_text.sql # Populate publishers from text fields
├── 00027_game_keytags.sql           # Keytag booleans for homepage collections
├── 00028_user_top_games.sql         # User top 10 games ranking
├── 00029_profile_enhancements.sql   # Header image, custom avatar, last_active_at
├── 00030_user_follows.sql           # Following system
├── 00031_user_activities.sql        # Activity feed
├── 00032_user_notifications.sql     # Notifications with trigger
├── 00033_game_reviews.sql           # Review columns on user_games
├── 00034_add_review_activity_type.sql # Review activity type
├── 00035_themes_table.sql           # Themes + game_themes junction
├── 00036_player_experiences_table.sql # Player experiences + junction
├── 00037_complexity_tiers.sql       # Complexity tiers + games.complexity_tier_id
├── 00038_bgg_tag_aliases.sql        # BGG alias system for imports
├── 00039_marketplace_foundation.sql # Feature flags table
├── 00040_marketplace_listings.sql   # Listings, images, saves, settings + enums
├── 00041_marketplace_messaging.sql  # Conversations, messages, triggers, RPC functions
├── 00042_marketplace_offers.sql     # Offers table, enums, RPC functions, triggers
├── 00043_marketplace_transactions.sql # Transactions, Stripe Connect, payment flow
├── 00044_marketplace_feedback.sql    # Feedback/reputation system
└── 00045_marketplace_discovery.sql   # Saved searches, wishlist alerts, similar listings
```

---

## Quick Commands

See `QUICK-REFERENCE.md` for full command reference.

```bash
npm run dev              # Start local dev
git push origin develop  # Deploy to staging
```

**Deploy to Production**: Create PR from develop → main at GitHub

---

## Key Files

### Admin
| File | Purpose |
|------|---------|
| `src/app/admin/(dashboard)/layout.tsx` | Auth check + admin nav |
| `src/app/admin/(dashboard)/games/[id]/` | Game editor |
| `src/app/admin/login/page.tsx` | OAuth + magic link |
| `src/app/auth/callback/route.ts` | OAuth callback handler |
| `src/components/admin/ImageUpload.tsx` | Image upload component |
| `src/app/api/admin/upload/route.ts` | Image upload API |

### User Auth & Shelf
| File | Purpose |
|------|---------|
| `src/lib/auth/AuthContext.tsx` | React auth context provider |
| `src/lib/supabase/user-queries.ts` | Shelf + profile + mutual games CRUD |
| `src/lib/supabase/review-queries.ts` | Game reviews + user reviews |
| `src/components/auth/UserMenu.tsx` | Header user dropdown |
| `src/components/shelf/AddToShelfButton.tsx` | Add game to shelf |
| `src/components/shelf/RatingInput.tsx` | 1-10 star rating |
| `src/components/settings/UsernameInput.tsx` | Username input with availability check |
| `src/app/login/page.tsx` | Login page |
| `src/app/shelf/page.tsx` | Shelf page |
| `src/app/settings/page.tsx` | Profile settings |
| `src/app/u/[username]/page.tsx` | Public profile page (server component) |
| `src/app/u/[username]/ProfileContent.tsx` | Profile layout orchestrator |
| `src/components/profile/ProfileIdentityCard.tsx` | Left sticky card (avatar, bio, social) |
| `src/components/profile/ProfileHeroStats.tsx` | Big stat cards + badges |
| `src/components/profile/ProfileShelfGrid.tsx` | Game collection with filter tabs |
| `src/components/profile/ProfileInsights.tsx` | Collection analytics |
| `src/components/profile/ProfileReviews.tsx` | User's written reviews |
| `src/components/profile/MutualGamesSection.tsx` | "Games You Both Have" |
| `src/components/profile/TopGamesDisplay.tsx` | Top 10 games horizontal strip |
| `src/components/profile/TopGamesEditor.tsx` | Drag & drop ranking editor |
| `src/components/settings/ProfileImageUpload.tsx` | Avatar upload |
| `src/app/api/user/profile-image/route.ts` | Profile image upload API |

### Social Features
| File | Purpose |
|------|---------|
| `src/lib/supabase/activity-queries.ts` | Activity feed queries |
| `src/lib/supabase/notification-queries.ts` | Notification queries |
| `src/components/profile/FollowButton.tsx` | Follow/unfollow button |
| `src/components/profile/FollowStats.tsx` | Follower/following counts |
| `src/components/profile/FollowersList.tsx` | Followers/following list |
| `src/components/feed/ActivityFeed.tsx` | Activity feed with infinite scroll |
| `src/components/feed/ActivityItem.tsx` | Individual activity card |
| `src/components/notifications/NotificationBell.tsx` | Bell icon + dropdown |
| `src/components/reviews/ReviewSection.tsx` | Reviews on game page |
| `src/components/reviews/ReviewCard.tsx` | Individual review display |
| `src/components/reviews/ReviewDialog.tsx` | Write/edit review modal |
| `src/components/reviews/AggregateRating.tsx` | Average rating display |
| `src/app/feed/page.tsx` | Activity feed page |
| `src/app/u/[username]/followers/page.tsx` | Followers list page |
| `src/app/u/[username]/following/page.tsx` | Following list page |

### Game Recommendation Engine
| File | Purpose |
|------|---------|
| `src/app/recommend/page.tsx` | Recommendation wizard page |
| `src/app/recommend/RecommendWizard.tsx` | Main wizard component with state |
| `src/app/api/recommendations/route.ts` | Recommendation API endpoint |
| `src/lib/recommend/types.ts` | Wizard types (answers, signals, archetypes) |
| `src/lib/recommend/scoring.ts` | Game scoring algorithm (0-100) |
| `src/lib/recommend/archetypes.ts` | Archetype definitions + classification |
| `src/lib/recommend/prompts.ts` | AI prompts + template personalization |
| `src/components/recommend/WizardContainer.tsx` | Layout with progress bar |
| `src/components/recommend/WelcomeStep.tsx` | Welcome screen |
| `src/components/recommend/ScenarioCards.tsx` | Card selection question |
| `src/components/recommend/SliderQuestion.tsx` | Slider with Continue button |
| `src/components/recommend/ArchetypeReveal.tsx` | Archetype animation |
| `src/components/recommend/RecommendationResults.tsx` | Results display |

### API & Security
| File | Purpose |
|------|---------|
| `src/lib/api/errors.ts` | Sanitized API error responses |
| `src/lib/api/rate-limit.ts` | In-memory rate limiter |
| `src/lib/api/auth.ts` | Cron auth verification |
| `src/lib/config/constants.ts` | Centralized magic numbers |
| `src/lib/config/bgg-mappings.ts` | BGG category to slug mappings |
| `src/lib/upload/validation.ts` | File upload validation (magic bytes) |
| `src/components/icons/social.tsx` | Social media icon components |

### Content Pipeline
| File | Purpose |
|------|---------|
| `src/lib/bgg/client.ts` | BGG XML API client |
| `src/lib/bgg/importer.ts` | Import games from BGG (includes families + relations) |
| `src/lib/ai/claude.ts` | Claude API client |
| `src/lib/ai/generator.ts` | Generate game content |
| `src/lib/ai/prompts.ts` | AI prompts for content |

### Game Families
| File | Purpose |
|------|---------|
| `src/app/families/page.tsx` | Family list page |
| `src/app/families/[slug]/page.tsx` | Family detail with grouped games |
| `src/components/games/FamilyBadge.tsx` | Badge on game pages |
| `src/components/families/FamilyCard.tsx` | Card for listings |
| `src/app/admin/(dashboard)/families/page.tsx` | Admin family list |
| `src/app/admin/(dashboard)/families/[id]/page.tsx` | Admin family editor |
| `src/components/admin/FamilyEditor.tsx` | Family form component |
| `src/components/admin/GameRelationsEditor.tsx` | Relations tab in game editor |
| `src/components/admin/GamePicker.tsx` | Searchable game selector |
| `src/app/api/admin/families/route.ts` | Family CRUD API |
| `src/app/api/admin/game-relations/route.ts` | Relations CRUD API |

### Publishers
| File | Purpose |
|------|---------|
| `src/app/publishers/page.tsx` | Publisher list page |
| `src/app/publishers/PublishersList.tsx` | Filters + grid (client component) |
| `src/app/publishers/[slug]/page.tsx` | Publisher detail page |
| `src/components/publishers/PublisherCard.tsx` | Publisher card with category badges |
| `src/app/admin/(dashboard)/publishers/page.tsx` | Admin publisher list |
| `src/app/admin/(dashboard)/publishers/[id]/page.tsx` | Admin publisher editor |
| `src/components/admin/PublisherEditor.tsx` | Publisher form component |
| `src/components/admin/LogoUpload.tsx` | Logo upload component |
| `src/app/api/admin/publishers/route.ts` | Publisher CRUD API |
| `src/app/api/admin/publisher-logo/route.ts` | Logo upload API |

### Games Page Filter UI V2
| File | Purpose |
|------|---------|
| `src/app/games/page.tsx` | Server component, fetches data |
| `src/app/games/GamesPageClient.tsx` | Client component, filter state management |
| `src/components/games/filters/FilterBar.tsx` | Horizontal range filter popovers |
| `src/components/games/filters/FilterSidebar.tsx` | Collapsible sidebar container |
| `src/components/games/filters/FilterRail.tsx` | Collapsed icon-only rail (48px) |
| `src/components/games/filters/FilterSection.tsx` | Accordion wrapper (Collapsible) |
| `src/components/games/filters/TaxonomyBadges.tsx` | Badge grid for taxonomy selection |
| `src/components/games/filters/RangeFilterPopover.tsx` | Popover with slider |
| `src/components/games/filters/ActiveFilters.tsx` | Horizontal pill bar |
| `src/components/games/filters/MobileFilterSheet.tsx` | Mobile drawer |
| `src/components/games/filters/constants.ts` | Icons, labels, DEFAULT_OPEN_SECTIONS |
| `src/components/games/filters/types.ts` | Filter types and defaults |
| `src/hooks/use-local-storage.ts` | SSR-safe localStorage hook |

### Marketplace
| File | Purpose |
|------|---------|
| `src/app/marketplace/page.tsx` | Browse listings page |
| `src/app/marketplace/listings/new/page.tsx` | Create listing wizard |
| `src/app/marketplace/listings/[id]/page.tsx` | Listing detail page |
| `src/app/marketplace/listings/[id]/edit/page.tsx` | Edit listing page |
| `src/app/marketplace/listings/[id]/ListingDetailActions.tsx` | Contact/save/offer/edit actions |
| `src/app/marketplace/my-listings/page.tsx` | User's listings dashboard |
| `src/app/marketplace/messages/page.tsx` | Messages inbox |
| `src/app/marketplace/messages/[id]/page.tsx` | Conversation thread |
| `src/app/marketplace/offers/page.tsx` | Offers dashboard (received + sent) |
| `src/lib/supabase/listing-queries.ts` | Listing CRUD operations |
| `src/lib/supabase/conversation-queries.ts` | Conversation/message queries |
| `src/lib/supabase/offer-queries.ts` | Offer CRUD + RPC functions |
| `src/lib/config/marketplace-constants.ts` | Fees, limits, durations |
| `src/types/marketplace.ts` | Marketplace TypeScript types |
| `src/components/marketplace/ListingCard.tsx` | Grid card component |
| `src/components/marketplace/ListingGrid.tsx` | Responsive grid layout |
| `src/components/marketplace/ConditionBadge.tsx` | Color-coded condition |
| `src/components/marketplace/CreateListingWizard.tsx` | 4-step create flow |
| `src/components/marketplace/messaging/ConversationList.tsx` | Inbox list |
| `src/components/marketplace/messaging/MessageThread.tsx` | Message thread UI |
| `src/components/marketplace/messaging/ContactSellerButton.tsx` | Start conversation |
| `src/components/marketplace/offers/MakeOfferDialog.tsx` | Make offer modal |
| `src/components/marketplace/offers/OfferCard.tsx` | Offer with actions |
| `src/components/marketplace/offers/TradeSelector.tsx` | Select games to trade |
| `src/components/marketplace/transactions/StripeConnectButton.tsx` | Seller onboarding |
| `src/components/marketplace/transactions/CheckoutButton.tsx` | Payment checkout |
| `src/components/marketplace/transactions/TransactionCard.tsx` | Transaction display |
| `src/components/marketplace/transactions/TransactionTimeline.tsx` | Status timeline |
| `src/components/marketplace/transactions/ShippingForm.tsx` | Add tracking |
| `src/lib/stripe/client.ts` | Server-side Stripe SDK |
| `src/lib/stripe/connect.ts` | Stripe Connect helpers |
| `src/lib/supabase/transaction-queries.ts` | Transaction CRUD |
| `src/lib/supabase/feedback-queries.ts` | Feedback + reputation queries |
| `src/app/marketplace/transactions/page.tsx` | Transaction dashboard |
| `src/app/api/stripe/webhooks/route.ts` | Stripe webhook handler |
| `src/components/marketplace/feedback/` | Feedback components |
| `src/components/profile/ProfileMarketplaceFeedback.tsx` | Profile reputation section |
| `src/lib/supabase/discovery-queries.ts` | Saved search + wishlist alert queries |
| `src/lib/utils/saved-search-utils.ts` | Client-safe saved search helpers |
| `src/app/marketplace/saved-searches/page.tsx` | Saved searches management page |
| `src/components/marketplace/discovery/SavedSearchCard.tsx` | Saved search display |
| `src/components/marketplace/discovery/SaveSearchButton.tsx` | Save current search dialog |
| `src/components/marketplace/discovery/WishlistAlertToggle.tsx` | Wishlist alert config |
| `src/components/marketplace/discovery/SimilarListings.tsx` | Similar listings grid |
| `src/components/marketplace/discovery/VerifiedSellerBadge.tsx` | Trust level badge |
| `src/lib/supabase/dashboard-queries.ts` | Dashboard data consolidation |
| `src/app/marketplace/dashboard/page.tsx` | Seller dashboard page |
| `src/app/marketplace/dashboard/SellerDashboardClient.tsx` | Dashboard client with URL tab sync |
| `src/app/marketplace/dashboard/loading.tsx` | Dashboard loading skeleton |
| `src/components/marketplace/MarketplaceSidebar.tsx` | Browse page sidebar wrapper |
| `src/app/marketplace/MarketplacePageClient.tsx` | Browse page with sidebar layout |
| `src/app/marketplace/loading.tsx` | Browse page loading skeleton |
| `src/components/marketplace/dashboard/DashboardSidebar.tsx` | Dashboard sidebar container |
| `src/components/marketplace/dashboard/SidebarNav.tsx` | Dashboard tab navigation |
| `src/components/marketplace/dashboard/SidebarQuickActions.tsx` | Earnings, rating, trust level |
| `src/components/marketplace/dashboard/HorizontalStats.tsx` | Compact stat chips |
| `src/components/marketplace/dashboard/MobileMenuTrigger.tsx` | Mobile hamburger with badge |
| `src/components/marketplace/dashboard/ActionRequiredSection.tsx` | Priority items |
| `src/components/marketplace/dashboard/DashboardTabs.tsx` | Tabbed content |

---

## Supabase Storage

**Bucket**: `game-images` (exists in both staging and production)
- Public read access
- Authenticated upload/delete
- Path: `{game-slug}/{timestamp}-{random}.{ext}`
- Max 5MB, JPG/PNG/WebP/GIF

**Bucket**: `publisher-logos` (exists in both staging and production)
- Public read access
- Authenticated upload/delete
- Path: `{publisher-slug}/{timestamp}.{ext}`
- Max 5MB, JPG/PNG/WebP/GIF

**Bucket**: `user-profiles` (exists in both staging and production)
- Public read access
- Authenticated upload/delete (users can only upload to their own folder)
- Path: `{user-id}/avatar/{timestamp}.{ext}`
- Max 5MB, JPG/PNG/WebP/GIF

**Bucket**: `listing-images` (exists in both staging and production)
- Public read access
- Authenticated upload/delete (users can only upload to their own listings)
- Path: `{listing-id}/{timestamp}-{random}.{ext}`
- Max 5MB, JPG/PNG/WebP/GIF
- Up to 6 images per listing

---

## OAuth Setup

### Google Cloud Console
- OAuth 2.0 Client ID configured
- Authorized redirect URIs:
  - `https://ndskcbuzsmrzgnvdbofd.supabase.co/auth/v1/callback` (staging)
  - `https://jnaibnwxpweahpawxycf.supabase.co/auth/v1/callback` (production)

### Staging Supabase Auth
- Site URL: `https://goodgame-staging-staging.up.railway.app`
- Redirect URLs:
  - `http://localhost:3399/**`
  - `https://goodgame-staging-staging.up.railway.app/**`

### Production Supabase Auth
- Site URL: `https://boardnomads.com`
- Redirect URLs:
  - `https://boardnomads.com/**`

---

## Next Steps

### Content
- Upload images for all games via admin
- Generate content for the 19 new BGG top 20 games
- Set up cron-job.org to trigger import/generate APIs
- Import more games to populate families and relations

### Other Future Features
- Local discovery (find gamers nearby, game nights)
- Enhanced profile stats (category breakdown)
- Push to production (merge develop → main)
