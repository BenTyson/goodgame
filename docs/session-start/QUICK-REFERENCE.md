# Quick Reference

## Environments

| Environment | URL | Database |
|-------------|-----|----------|
| Local | http://localhost:3399 | Staging |
| Staging | https://goodgame-staging-staging.up.railway.app | Staging |
| Production | https://boardnomads.com | Production |

## Commands

```bash
# Development
npm run dev                    # Start dev server (port 3399, Turbopack)
npm run build && npm start     # Production build + server (use if Turbopack has issues)
npm run build                  # Production build only
npm run lint                   # ESLint check

# Git (always work on develop)
git checkout develop           # Switch to develop
git push origin develop        # Deploy to staging

# Supabase (linked to staging by default)
npx supabase db push           # Push migrations to staging

# Push to production database
npx supabase link --project-ref jnaibnwxpweahpawxycf
npx supabase db push
npx supabase link --project-ref ndskcbuzsmrzgnvdbofd  # Switch back

# Regenerate types
npx supabase gen types typescript --project-ref ndskcbuzsmrzgnvdbofd > src/types/supabase.ts

# Railway
railway environment staging && railway service goodgame-staging
railway environment production && railway service goodgame
railway logs
```

## Supabase Projects

| Project | Ref ID | Used By |
|---------|--------|---------|
| **Staging** | `ndskcbuzsmrzgnvdbofd` | localhost + Railway staging |
| **Production** | `jnaibnwxpweahpawxycf` | Railway production |

## File Locations

### App Routes
```
src/app/
├── page.tsx                   # Homepage
├── games/
│   ├── page.tsx              # All games listing
│   └── [slug]/
│       ├── page.tsx          # Game hub
│       ├── rules/page.tsx
│       ├── score-sheet/page.tsx
│       ├── setup/page.tsx
│       └── reference/page.tsx
├── categories/
│   ├── page.tsx              # Categories listing
│   └── [slug]/page.tsx       # Category detail
├── collections/
│   ├── page.tsx              # Collections listing
│   └── [slug]/page.tsx       # Collection detail
├── designers/
│   ├── page.tsx              # Designers listing
│   └── [slug]/page.tsx       # Designer detail
├── publishers/
│   ├── page.tsx              # Publishers listing
│   └── [slug]/page.tsx       # Publisher detail
├── admin/                     # Admin panel
│   ├── login/page.tsx
│   └── (dashboard)/
│       ├── page.tsx          # Dashboard
│       ├── games/            # Game management
│       ├── families/         # Family management
│       ├── publishers/       # Publisher management
│       └── queue/            # Import queue
├── login/page.tsx             # User login
├── shelf/page.tsx             # User's game collection
├── settings/page.tsx          # Profile settings (avatar upload)
├── u/[username]/page.tsx      # Public user profiles (V3 UI: card-based, two-column)
├── u/[username]/followers/    # Followers list
├── u/[username]/following/    # Following list
├── feed/page.tsx              # Activity feed from followed users
├── recommend/page.tsx         # Game recommendation wizard
├── api/recommendations/       # Recommendation API endpoint
├── api/user/profile-image/    # User profile image upload API
├── api/games/search/          # Game search API (for marketplace game selector)
├── api/marketplace/           # Marketplace API routes
│   ├── listings/
│   │   ├── route.ts           # GET (browse), POST (create)
│   │   └── [id]/
│   │       ├── route.ts       # GET, PATCH, DELETE
│   │       ├── saved/route.ts # Check if saved
│   │       └── save/route.ts  # POST/DELETE save
│   ├── conversations/         # Messaging API
│   │   ├── route.ts           # GET, POST
│   │   └── [id]/
│   │       ├── route.ts       # GET, PATCH
│   │       └── messages/route.ts # POST
│   ├── offers/                # Offers API
│   │   ├── route.ts           # GET, POST
│   │   └── [id]/route.ts      # GET, PATCH
│   ├── transactions/          # Transactions API
│   │   ├── route.ts           # GET, POST
│   │   └── [id]/
│   │       ├── route.ts       # GET, PATCH
│   │       └── checkout/route.ts # POST
│   ├── feedback/              # Feedback API
│   │   ├── route.ts           # GET, POST
│   │   └── [transactionId]/route.ts # GET
│   ├── reputation/
│   │   └── [userId]/route.ts  # GET
│   └── stripe/
│       └── connect/           # Stripe Connect API
│           ├── route.ts       # GET, POST
│           ├── callback/route.ts
│           └── refresh/route.ts
├── api/stripe/
│   └── webhooks/route.ts      # Stripe webhook handler
├── marketplace/
│   ├── page.tsx               # Browse marketplace listings
│   ├── listings/
│   │   ├── new/page.tsx       # Create listing wizard
│   │   └── [id]/page.tsx      # Listing detail
│   ├── my-listings/page.tsx   # User's listings dashboard
│   ├── messages/              # Messaging pages
│   │   ├── page.tsx           # Messages inbox
│   │   └── [id]/page.tsx      # Conversation thread
│   ├── offers/page.tsx        # Offers dashboard
│   └── transactions/          # Transactions pages
│       ├── page.tsx           # Transactions dashboard
│       └── [id]/page.tsx      # Transaction detail
├── score-sheets/page.tsx
├── rules/page.tsx
├── sitemap.ts                 # Dynamic sitemap
└── robots.ts                  # Robots.txt
```

### Components
```
src/components/
├── ui/                        # shadcn/ui (don't edit directly)
├── layout/                    # Header, Footer, ThemeProvider
├── games/                     # GameCard, GameGrid, ImageGallery, RelatedGames
│   └── filters/               # V2 Filter UI (FilterBar, FilterSidebar, FilterRail, etc.)
├── families/                  # FamilyCard, FamilyBadge
├── publishers/                # PublisherCard
├── admin/                     # ImageUpload, LogoUpload, ContentEditor, FamilyEditor, PublisherEditor
├── auth/                      # UserMenu
├── shelf/                     # AddToShelfButton, RatingInput
├── settings/                  # UsernameInput, ProfileImageUpload
├── profile/                   # ProfileIdentityCard, ProfileHeroStats, ProfileShelfGrid, ProfileInsights, ProfileReviews, MutualGamesSection, TopGamesDisplay, TopGamesEditor, FollowButton
├── feed/                      # ActivityFeed, ActivityItem
├── notifications/             # NotificationBell
├── reviews/                   # ReviewSection, ReviewCard, ReviewDialog, AggregateRating
├── recommend/                 # WizardContainer, WelcomeStep, ScenarioCards, SliderQuestion, ArchetypeReveal, RecommendationResults
├── score-sheet/               # ScoreSheetGenerator (jsPDF)
├── setup/                     # SetupChecklist (interactive)
├── search/                    # SearchDialog (Cmd+K)
├── monetization/              # AdUnit, AffiliateButton (planned)
└── marketplace/               # Marketplace components
    ├── ListingCard.tsx        # Listing grid card
    ├── ListingGrid.tsx        # Responsive listing grid
    ├── ConditionBadge.tsx     # Game condition indicator
    ├── ListingTypeBadge.tsx   # Sell/Trade/Want badge
    ├── filters/               # Filter UI components
    │   ├── MarketplaceFilterSidebar.tsx
    │   ├── MarketplaceFilterRail.tsx
    │   └── MarketplaceFilterBar.tsx
    ├── forms/                 # Create/edit listing wizard
    │   ├── GameSelector.tsx   # Game search & select
    │   ├── DetailsForm.tsx    # Condition, description
    │   └── PricingForm.tsx    # Price, shipping
    ├── messaging/             # Messaging components
    │   ├── ConversationList.tsx
    │   ├── MessageThread.tsx
    │   └── ContactSellerButton.tsx
    ├── offers/                # Offer components
    │   ├── MakeOfferDialog.tsx
    │   ├── OfferCard.tsx
    │   └── TradeSelector.tsx
    ├── transactions/          # Transaction components
    │   ├── StripeConnectButton.tsx  # Seller onboarding
    │   ├── CheckoutButton.tsx       # Payment checkout
    │   ├── TransactionCard.tsx      # Transaction display
    │   ├── TransactionTimeline.tsx  # Status timeline
    │   └── ShippingForm.tsx         # Add tracking
    └── feedback/              # Feedback components
        ├── FeedbackCard.tsx         # Individual feedback display
        ├── ReputationBadge.tsx      # Trust level badge
        ├── SellerRating.tsx         # Seller reputation display
        └── TransactionFeedback.tsx  # Leave feedback form

src/hooks/
└── use-local-storage.ts       # SSR-safe localStorage hook
```

### Data & Types
```
src/types/supabase.ts          # Auto-generated from Supabase schema
src/types/database.ts          # Convenience types (GameRow, GameInsert, etc.)
src/lib/supabase/              # Database clients (client.ts, server.ts)
src/lib/bgg/                   # BGG API client and importer
src/lib/ai/                    # Claude AI content generator
src/lib/recommend/             # Recommendation engine (types, scoring, archetypes, prompts)
src/lib/seo/                   # JSON-LD structured data components
src/lib/auth/                  # AuthContext provider
src/lib/config/                # App configuration
  ├── feature-flags.ts         # Feature flag utilities
  └── marketplace-constants.ts # Marketplace config (fees, limits)
src/lib/stripe/                # Stripe SDK
  ├── client.ts                # Server-side Stripe client
  └── connect.ts               # Stripe Connect helpers
src/lib/supabase/
  ├── listing-queries.ts       # Marketplace listing CRUD
  ├── conversation-queries.ts  # Messaging queries
  ├── offer-queries.ts         # Offer queries
  ├── transaction-queries.ts   # Transaction queries
  └── feedback-queries.ts      # Feedback/reputation queries
supabase/migrations/           # Database schema (44 files)
```

### Type Definitions
```typescript
// From src/types/database.ts
GameRow          // Game without generated columns (for mock data)
Game             // Full game type including fts column
GameInsert       // For inserting new games
Category         // Category type
Collection       // Collection type
GameImage        // Game image type
Award            // Award organization type
AwardCategory    // Award category type
GameAward        // Game-award link type
Designer         // Designer type
Publisher        // Publisher type
Artist           // Artist type
UserProfile      // User profile type (with custom_avatar_url, last_active_at)
UserGame         // User shelf item type
UserTopGame      // User's top 10 ranked games
ShelfStatus      // 'owned' | 'want_to_buy' | 'want_to_play' | 'previously_owned' | 'wishlist'
SocialLinks      // Social links interface (bgg_username, twitter_handle, etc.)
TopGameWithDetails // Top game with game details for display
MutualGame       // Game both users have in common
UserReviewWithGame // User's review with game details for profile display
UserFollow       // Follow relationship
FollowStats      // followerCount, followingCount
ActivityType     // 'follow' | 'shelf_add' | 'shelf_update' | 'rating' | 'top_games_update' | 'review'
UserActivity     // Activity record
NotificationType // 'new_follower' | 'rating' | marketplace notifications
UserNotification // Notification record
ReviewWithUser   // Review with user profile

// Marketplace types (from src/types/marketplace.ts)
ListingType      // 'sell' | 'trade' | 'want'
ListingStatus    // 'draft' | 'active' | 'pending' | 'sold' | 'traded' | 'expired' | 'cancelled'
GameCondition    // 'new_sealed' | 'like_new' | 'very_good' | 'good' | 'acceptable'
ShippingPreference // 'local_only' | 'will_ship' | 'ship_only'
MarketplaceListing // Full listing type
ListingCardData  // Listing for grid display
ListingFilters   // Browse filter state
MarketplaceListingInsert // Create listing
MarketplaceListingUpdate // Update listing

// Offer types
OfferType        // 'buy' | 'trade' | 'buy_plus_trade'
OfferStatus      // 'pending' | 'accepted' | 'declined' | 'countered' | 'expired' | 'withdrawn'
MarketplaceOffer // Full offer type
OfferWithDetails // Offer with listing/buyer/seller info

// Transaction types
TransactionStatus // 'pending_payment' | 'payment_held' | 'shipped' | 'delivered' | 'completed' | etc.
ShippingCarrier  // 'usps' | 'ups' | 'fedex' | 'dhl' | 'other'
MarketplaceTransaction // Full transaction type
TransactionWithDetails // Transaction with offer/listing/buyer/seller info

// Feedback types
FeedbackRole     // 'buyer' | 'seller'
TrustLevel       // 'new' | 'established' | 'trusted' | 'top_seller'
MarketplaceFeedback // Feedback record
FeedbackWithDetails // Feedback with reviewer info
UserReputationStats // Aggregated reputation stats
FeedbackAbility  // Can leave feedback check result
```

## Environment Variables

```env
# Staging Supabase (localhost + staging)
NEXT_PUBLIC_SUPABASE_URL=https://ndskcbuzsmrzgnvdbofd.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

# Site
NEXT_PUBLIC_SITE_URL=http://localhost:3399
NEXT_PUBLIC_SITE_NAME=Board Nomads
NEXT_PUBLIC_APP_URL=http://localhost:3399  # For Stripe redirects

# Admin
ADMIN_EMAILS=your-email@gmail.com

# Stripe (for marketplace payments)
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

## Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `GameCard.tsx` |
| Utilities | camelCase | `formatPlayerCount.ts` |
| Routes | kebab-case | `/score-sheets` |
| Database | snake_case | `game_categories` |
| CSS classes | kebab-case | `.game-card-header` |

## Design System

- **Primary**: Teal `oklch(0.55 0.15 195)`
- **Shadow variables**: `--shadow-card`, `--shadow-card-hover`, `--shadow-glow-primary`
- **Dark mode**: Warm charcoal (hue 55-70)
- **Light mode**: Warm cream whites

## URLs

- **Local**: http://localhost:3399
- **Staging**: https://goodgame-staging-staging.up.railway.app
- **Production**: https://boardnomads.com
- **Staging Supabase**: https://supabase.com/dashboard/project/ndskcbuzsmrzgnvdbofd
- **Production Supabase**: https://supabase.com/dashboard/project/jnaibnwxpweahpawxycf
- **Railway**: https://railway.app/dashboard

## Key App Routes

| Route | Description |
|-------|-------------|
| `/marketplace` | Browse marketplace listings |
| `/marketplace/listings/new` | Create new listing wizard |
| `/marketplace/listings/[id]` | View listing detail |
| `/marketplace/my-listings` | User's listings dashboard |
| `/marketplace/messages` | Messages inbox |
| `/marketplace/messages/[id]` | Conversation thread |
| `/marketplace/offers` | Offers dashboard (received + sent) |
| `/marketplace/transactions` | Transactions dashboard (purchases + sales) |
| `/marketplace/transactions/[id]` | Transaction detail |
| `/games` | Browse all games |
| `/games/[slug]` | Game hub page |
| `/shelf` | User's game collection |
| `/settings` | Profile settings (includes Stripe onboarding) |
| `/u/[username]` | Public user profile |
| `/feed` | Activity feed |
| `/recommend` | Game recommendation wizard |

## Known Issues

### Turbopack Dev Mode Bug (Next.js 16)
**Symptom:** Some pages (e.g., `/publishers`) hang indefinitely with `Maximum call stack size exceeded at Map.set` error.

**Workaround:** Use production build instead of dev mode:
```bash
npm run build && npm start
```

**Status:** Upstream Turbopack bug in Next.js 16. Does not affect production builds.
