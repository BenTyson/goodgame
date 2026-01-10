# Quick Reference

## Verify Changes

```bash
npm run build    # MUST pass before committing - catches type errors
```

## Environments

| Environment | URL | Database |
|-------------|-----|----------|
| Local | http://localhost:3399 | Staging |
| Staging | https://goodgame-staging-staging.up.railway.app | Staging |
| Production | https://boardnomads.com | Production |

**Dashboards:**
- Staging Supabase: https://supabase.com/dashboard/project/ndskcbuzsmrzgnvdbofd
- Production Supabase: https://supabase.com/dashboard/project/jnaibnwxpweahpawxycf
- Railway: https://railway.app/dashboard

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

# Game Import & Relations Scripts
npx tsx scripts/process-import-queue.ts --limit=10     # Process BGG import queue
npx tsx scripts/import-missing-relations.ts --dry-run  # Find missing related games
npx tsx scripts/import-missing-relations.ts --skip-fan --skip-promos  # Skip unofficial content
npx tsx scripts/sync-game-relations.ts --dry-run       # Sync relations from bgg_raw_data
npx tsx scripts/sync-game-relations.ts --family=CATAN  # Sync specific family only
npx tsx scripts/backfill-bgg-images.ts --limit=10      # Backfill missing BGG thumbnails
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
│       └── page.tsx          # Tabbed game page (Overview|Rules|Setup|ScoreSheet)
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
│       ├── vecna/            # Vecna content pipeline
│       ├── games/            # Game management
│       ├── import/           # BGG import wizard
│       ├── taxonomy/         # Taxonomy management
│       ├── families/         # Family management
│       ├── publishers/       # Publisher management
│       └── data/             # Data dictionary
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
├── api/admin/                  # Admin API routes
│   ├── games/
│   │   ├── route.ts           # GET, PATCH games
│   │   ├── taxonomy/route.ts  # GET/POST/PATCH taxonomy assignments
│   │   └── [id]/
│   │       ├── route.ts                  # PATCH update game fields (amazon_asin, tagline, etc.)
│   │       ├── reset-content/route.ts    # POST reset parsed content
│   │       ├── sync-bgg/route.ts         # POST re-sync BGG data
│   │       ├── resync-wikipedia/route.ts # POST re-sync Wikipedia + award sync + ASIN fetch
│   │       └── wikipedia/route.ts        # GET status, POST fetch Wikipedia summary
│   ├── families/
│   │   └── [id]/
│   │       ├── wikipedia/route.ts  # POST fetch Wikipedia, PATCH link games
│   │       └── auto-link/route.ts  # POST analyze relations, PUT create relations
│   ├── import/
│   │   ├── analyze/route.ts   # POST analyze BGG IDs before import
│   │   └── execute/route.ts   # POST execute import with SSE progress
│   ├── rulebook/
│   │   ├── parse/route.ts     # POST parse rulebook + generate thumbnail
│   │   ├── upload/route.ts    # POST upload rulebook PDF
│   │   ├── validate/route.ts  # POST validate rulebook URL
│   │   └── generate-content/route.ts  # POST generate rules/setup/reference
│   ├── game-videos/route.ts   # POST/PATCH/DELETE video management
│   ├── youtube/search/route.ts # YouTube video search (Data API v3)
│   ├── retailers/route.ts      # GET/POST/PATCH/DELETE retailer management
│   ├── purchase-links/route.ts # GET/POST/PATCH/DELETE per-game purchase links
│   └── upload/route.ts        # POST image upload
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
├── ui/                        # shadcn/ui + custom UI components
│   └── auto-resize-textarea.tsx  # Textarea that expands with content
├── layout/                    # Header, Footer, ThemeProvider
├── games/                     # Game page components
│   ├── GameCard.tsx           # Game card for listings
│   ├── GameGrid.tsx           # Responsive game grid
│   ├── GamePageTabs.tsx       # Hash-based tab container with URL sync
│   ├── GameHero.tsx           # Simplified hero with single image, key stats
│   ├── QuickStatsBar.tsx      # Players/time/complexity/age badges
│   ├── ImageGallery.tsx       # Game image gallery with lightbox (uses MediaModal)
│   ├── VideoCarousel.tsx      # Video carousel with modal player (uses MediaModal)
│   ├── MediaModal.tsx         # Shared modal shell for media galleries (backdrop, nav, close)
│   ├── RelatedGames.tsx       # Related games section
│   ├── TaxonomySection.tsx    # Categories, mechanics, themes, experiences badges
│   ├── ComplexityDisplay.tsx  # Crunch Score with breakdown tooltip (falls back to weight)
│   ├── AgeRating.tsx          # "Ages X+" badge with tier classification
│   ├── CreditsSection.tsx     # Designers, Artists, Publishers with links
│   ├── ComponentsList.tsx     # "What's in the Box" collapsible grid
│   ├── WikipediaContent.tsx   # Gameplay/Reception with CC-BY-SA attribution
│   ├── GameRelationsSection.tsx # Base game, expansions, family link
│   ├── tabs/                  # Tabbed game page content
│   │   ├── index.ts           # Barrel exports
│   │   ├── OverviewTab.tsx    # Discovery content (about, credits, relations)
│   │   ├── RulesTab.tsx       # How to Play with Wikipedia integration
│   │   ├── SetupTab.tsx       # Setup checklist and components
│   │   └── ScoreSheetTab.tsx  # Score sheet generator
│   └── filters/               # V2 Filter UI (FilterBar, FilterSidebar, FilterRail, etc.)
├── families/                  # FamilyCard, FamilyBadge
├── publishers/                # PublisherCard
├── admin/                     # Admin editors and components
│   ├── index.ts               # Barrel exports for all admin components
│   ├── AdminSidebar.tsx       # Sidebar with hamburger drawer (matches GamesSidebar)
│   ├── AdminLayoutClient.tsx  # Client wrapper for mobile state management
│   ├── GameEditor.tsx         # Game editor (uses tab components)
│   ├── FamilyEditor.tsx       # Family editor with tree view
│   ├── FamilyTreeView.tsx     # Visual family tree with relations
│   ├── WikipediaEnrichment.tsx # AI-powered Wikipedia game discovery
│   ├── AutoLinkRelations.tsx  # AI-powered relation creation from Wikipedia
│   ├── RulebookEditor.tsx     # Rulebook editor (uses sub-components)
│   ├── ImageUpload.tsx        # Image uploader with unified gallery, primary indicator, crop flow
│   ├── ImageCropper.tsx       # Cropper modal (react-easy-crop)
│   ├── VideoManager.tsx       # YouTube video management (add/delete/feature videos)
│   ├── TempImage.tsx          # SourcedImage component (badges: BGG/Wikidata/Wikipedia/Uploaded)
│   ├── CardHeaderWithIcon.tsx # Shared card header with icon (used across tabs)
│   ├── SwitchField.tsx        # Shared switch toggle with label/description
│   ├── SourceStatusCard.tsx   # Shared data source status card
│   ├── game-editor/           # GameEditor tab components (7 tabs)
│   │   ├── DetailsTab.tsx         # Core info, metadata, Crunch Score, publishing, External References
│   │   ├── TaxonomyTab.tsx        # Categories, mechanics, themes, player experiences
│   │   ├── RulebookTab.tsx        # Rulebook URL, parsing, parsed text viewer
│   │   ├── ContentTab.tsx         # Rules, setup, reference content
│   │   ├── SourcesTab.tsx         # BGG/Wikidata/Wikipedia data display
│   │   ├── MediaTab.tsx           # Images + Videos management (orchestrates sub-components)
│   │   ├── PurchaseLinksTab.tsx   # Retailer purchase links management
│   │   ├── WikimediaCommonsSearch.tsx  # Commons image search with results grid
│   │   ├── AvailableImageSources.tsx   # Wikipedia/Wikidata/BGG source images
│   │   ├── YouTubeVideoSearch.tsx      # YouTube video search (Data API v3)
│   │   └── TaxonomySelector.tsx   # Multi-select with AI badges (auto-selects ≥70%)
│   ├── rulebook/              # RulebookEditor sub-components
│   │   ├── RulebookUrlSection.tsx
│   │   ├── RulebookParseSection.tsx
│   │   ├── CrunchScoreDisplay.tsx  # Complexity score display (1-10 scale)
│   │   └── ContentGenerationModal.tsx
│   ├── import/                # Import wizard components
│   │   ├── ImportWizard.tsx   # Main import orchestrator with SSE
│   │   ├── ImportInput.tsx    # BGG ID input step
│   │   ├── ImportPreview.tsx  # Preview games to import
│   │   ├── ImportProgress.tsx # Real-time progress display
│   │   └── ImportReport.tsx   # Import summary with family navigation
│   └── vecna/                 # Vecna pipeline components (in app/admin/vecna/components/)
│       ├── VecnaPipeline.tsx        # Main orchestrator
│       ├── VecnaFamilySidebar.tsx   # Left sidebar with phase filters
│       ├── VecnaFamilyHeader.tsx    # Family header + batch actions
│       ├── VecnaGamePanel.tsx       # 2-tab game view (Pipeline + Details)
│       ├── VecnaEmptyState.tsx      # Empty state message
│       ├── PipelineProgressBar.tsx  # 4-phase visual progress indicator
│       ├── BlockedStateAlert.tsx    # Prominent blocked state banners
│       ├── SourcesDrawer.tsx        # Debug sources slide-out drawer
│       ├── StateActions.tsx         # State transition actions
│       ├── RulebookDiscovery.tsx    # Rulebook URL discovery UI
│       ├── FamilyBatchActions.tsx   # Batch processing dropdown
│       ├── CompletenessReport.tsx   # Data completeness report
│       ├── ContentReviewPanel.tsx   # Three-column review UI
│       └── AutoProcessModal.tsx     # SSE streaming progress modal
├── auth/                      # UserMenu
├── shelf/                     # AddToShelfButton, RatingInput
├── ratings/                   # D10 Sphere Rating System
│   ├── D10Dice.tsx           # 3D sphere SVG component
│   ├── D10RatingInput.tsx    # Interactive 1-10 rating input
│   ├── HeroRating.tsx        # Auth-aware rating wrapper
│   └── index.ts              # Barrel exports
├── settings/                  # UsernameInput, ProfileImageUpload
├── profile/                   # ProfileIdentityCard, ProfileHeroStats, ProfileShelfGrid, ProfileInsights, ProfileReviews, MutualGamesSection, TopGamesDisplay, TopGamesEditor, FollowButton
├── feed/                      # ActivityFeed, ActivityItem
├── notifications/             # NotificationBell
├── reviews/                   # ReviewSection, ReviewCard, ReviewDialog, AggregateRating
├── recommend/                 # WizardContainer, WelcomeStep, ScenarioCards, SliderQuestion, ArchetypeReveal, RecommendationResults
├── score-sheet/               # ScoreSheetGenerator (jsPDF)
├── setup/                     # SetupChecklist (interactive)
├── search/                    # SearchDialog (Cmd+K)
├── monetization/              # AdUnit, AffiliateButton (retailer support), AmazonButton, BuyButtons
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
├── use-local-storage.ts       # SSR-safe localStorage hook
├── use-media-modal.ts         # Modal state, keyboard nav (Escape/arrows), body overflow
├── use-expandable-list.ts     # Expand/collapse pattern for lists
└── admin/                     # Admin-specific hooks
    ├── useAsyncAction.ts      # Saving/saved/error state for async operations
    ├── useAutoSlug.ts         # Auto-generate slug from name
    ├── useWizardProgress.ts   # localStorage-based wizard state with step tracking
    └── index.ts               # Barrel exports
```

### Scripts
```
scripts/
├── process-import-queue.ts        # Process pending BGG imports (--limit, --all)
├── import-missing-relations.ts    # Find/queue missing related games (--dry-run, --skip-fan, --skip-promos)
├── sync-game-relations.ts         # Sync relations from bgg_raw_data (--family, --type, --dry-run)
├── backfill-bgg-images.ts         # Backfill missing reference_images (--limit, --name)
├── detect-family-base-games.ts    # Auto-detect base games for families (--dry-run)
├── update-unimported-relations-flag.ts  # Update has_unimported_relations flag
├── enrich-wikidata.ts             # Enrich games with Wikidata data
├── clear-games.ts                 # Emergency: truncate all game tables
└── archive/                       # Legacy scripts (one-time migrations, test utilities)
```

### Data & Types
```
src/types/supabase.ts          # Auto-generated from Supabase schema
src/types/database.ts          # Convenience types (GameRow, GameInsert, etc.)
src/lib/supabase/              # Database clients (client.ts, server.ts)
src/lib/bgg/                   # BGG API client and importer
src/lib/ai/                    # Claude AI content generator
src/lib/recommend/             # Recommendation engine (types, scoring, archetypes, prompts)
src/lib/rulebook/              # Rulebook parsing and Crunch Score
  ├── complexity.ts            # Crunch Score generation with BGG calibration (server-only)
  ├── complexity-utils.ts      # Pure utilities safe for client components (tier labels, colors)
  ├── parser.ts                # PDF text extraction
  ├── prompts.ts               # AI prompts for extraction (Crunch Score, taxonomy, content generation)
  ├── types.ts                 # CrunchBreakdown, CrunchResult, RulesContent, etc.
  ├── discovery.ts             # Publisher URL pattern matching
  └── thumbnail.ts             # PDF → PNG thumbnail generator (unpdf + @napi-rs/canvas)
src/lib/youtube/               # YouTube Data API v3 integration
  ├── client.ts                # YouTube search and video details
  ├── types.ts                 # API response types (YouTubeVideo, etc.)
  └── index.ts                 # Barrel exports
src/lib/wikipedia/             # Wikipedia integration utilities
  ├── index.ts                 # enrichGameFromWikipedia(), prepareWikipediaStorageData()
  ├── client.ts                # Rate-limited MediaWiki API client (follows redirects)
  ├── sections.ts              # Section extraction with cleanSectionWikitext()
  └── types.ts                 # MediaWiki API response types
src/lib/wikidata/              # Wikidata SPARQL integration
  ├── client.ts                # executeSparqlQuery(), getGameASINByBggId(), getGameASINByWikidataId(), getGameASINWithFallback()
  ├── queries.ts               # SPARQL queries (board game lookup, ASIN P5749, awards P166)
  └── index.ts                 # Barrel exports
src/lib/enrichment/            # Data enrichment utilities
  └── parallel.ts              # enrichGameParallel() - parallel Wikidata/Wikipedia/Commons/ASIN fetching
src/lib/vecna/                 # Vecna pipeline utilities
  ├── types.ts                 # VecnaState, Phase, ProcessingMode, ProcessingResult, etc.
  ├── pipeline.ts              # Pipeline orchestration (isBlockedState, calculatePipelineProgress)
  ├── processing.ts            # Shared processing (runParseStep, runGenerateStep, rebuildFamilyContext)
  ├── context.ts               # Family context utilities
  ├── completeness.ts          # Field completeness checking utility
  ├── ui-theme.ts              # Centralized STATUS_COLORS and IMPORTANCE_COLORS
  └── index.ts                 # Barrel exports
src/lib/admin/                 # Admin utilities
  ├── utils.ts                 # formatDate(), filterHighConfidenceSuggestions(), selectionsEqual()
  └── wizard/                  # Wizard context and utilities (legacy)
src/lib/ai/
  ├── claude.ts                # Claude AI wrapper with repairJSON() for response sanitization
  ├── generator.ts             # Content generation orchestrator
  └── prompts.ts               # AI prompts for content generation
src/lib/utils/
  ├── format.ts                # formatFileSize utility
  ├── image-crop.ts            # Canvas-based crop utility, aspect ratio presets
  ├── complexity.ts            # Complexity tier utilities (getCrunchTier, getComplexityLabel)
  ├── wikipedia.ts             # Wikipedia cleaning (cleanWikipediaContent, truncateAtWordBoundary)
  └── youtube.ts               # YouTube utilities (getYouTubeThumbnailUrl, extractYouTubeVideoId)
src/lib/seo/                   # JSON-LD structured data components
src/lib/auth/                  # AuthContext provider
src/lib/config/                # App configuration
  ├── feature-flags.ts         # Feature flag utilities
  ├── marketplace-constants.ts # Marketplace config (fees, limits)
  └── bgg-mappings.ts          # BGG category/theme/experience mappings
src/lib/stripe/                # Stripe SDK
  ├── client.ts                # Server-side Stripe client
  └── connect.ts               # Stripe Connect helpers
src/lib/supabase/
  ├── listing-queries.ts       # Marketplace listing CRUD
  ├── conversation-queries.ts  # Messaging queries
  ├── offer-queries.ts         # Offer queries
  ├── transaction-queries.ts   # Transaction queries
  └── feedback-queries.ts      # Feedback/reputation queries
supabase/migrations/           # Database schema (69 files)
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
GameVideo        // Game video type (youtube_video_id, video_type, is_featured)
Award            // Award organization type
AwardCategory    // Award category type
GameAward        // Game-award link type
Designer         // Designer type
Publisher        // Publisher type
Artist           // Artist type
Retailer         // Retailer type (slug, name, brand_color, url_pattern, affiliate_tag)
RetailerType     // 'online' | 'local' | 'marketplace'
AffiliateLinkWithRetailer // AffiliateLink with joined retailer data
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

// Rulebook types (from src/lib/rulebook/types.ts)
CrunchBreakdown    // Complexity breakdown (setup, teach, decisions, etc.)
ComponentList      // Parsed component counts (cards, dice, tokens, etc.)

// Taxonomy types
TaxonomySuggestion // AI-generated taxonomy suggestion
TaxonomySuggestionInsert // For inserting suggestions
TaxonomyExtractionResult // AI extraction response format
TaxonomySource     // 'bgg' | 'wikidata' | 'wikipedia' | 'ai' | 'manual'

// Vecna types (from src/lib/vecna/types.ts)
VecnaState         // Processing state enum (11 states)
Phase              // Visual phase: 'import' | 'parse' | 'generate' | 'publish'
PHASE_MAPPING      // Map VecnaState → Phase
BLOCKED_STATES     // States requiring user action: ['rulebook_missing', 'review_pending']
PROCESSING_STATES  // Active processing states: ['parsing', 'generating']
PHASE_CONFIG       // Phase display config (label, description, states)
getPhaseForState() // Helper to get phase from state
getCompletedPhases() // Get phases completed before current state
VecnaGame          // Game with processing state and data sources
VecnaFamily        // Family with games for sidebar display
FamilyContext      // Base game context for expansion processing
DataSource         // 'bgg' | 'wikidata' | 'wikipedia' | 'manual' | 'ai'
SourcedField<T>    // Field value with source tracking
ProcessingMode     // 'full' | 'parse-only' | 'generate-only' | 'from-current'
ProcessingResult   // Result of processing a single game
ProcessingResponse // Response from family batch processing

// Content types (union types for AI generation)
ReferenceContent['endGame'] // string | { triggers, finalRound?, winner, tiebreakers? }

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

# YouTube (for video search in admin)
YOUTUBE_API_KEY=...

# Amazon Associates (for affiliate links)
NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG=goodgame-20

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
| `/games/[slug]` | Game page (tabbed: Overview, Rules, Setup, Score Sheet) |
| `/games/[slug]#rules` | Game page - How to Play tab |
| `/games/[slug]#setup` | Game page - Setup tab |
| `/games/[slug]#score-sheet` | Game page - Score Sheet tab |
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
