/**
 * Marketplace Constants
 *
 * Configuration values for the Buy/Sell/Trade marketplace.
 */

// ===========================================
// FEES & PRICING
// ===========================================

export const MARKETPLACE_FEES = {
  /** Platform fee percentage (3% to match BGG, prioritize growth) */
  PLATFORM_FEE_PERCENT: 3,

  /** Stripe processing fee (approximate, actual varies) */
  STRIPE_FEE_PERCENT: 2.9,
  STRIPE_FEE_FIXED_CENTS: 30,

  /** Minimum listing price in cents ($1.00) */
  MIN_PRICE_CENTS: 100,

  /** Maximum listing price in cents ($10,000) */
  MAX_PRICE_CENTS: 1000000,
} as const

// ===========================================
// LISTING LIMITS
// ===========================================

export const LISTING_LIMITS = {
  /** Maximum photos per listing */
  MAX_IMAGES: 6,

  /** Maximum description length */
  MAX_DESCRIPTION_LENGTH: 2000,

  /** Maximum title length */
  MAX_TITLE_LENGTH: 200,

  /** Maximum trade preferences text length */
  MAX_TRADE_PREFERENCES_LENGTH: 500,

  /** Maximum games to list for trade */
  MAX_TRADE_GAMES: 10,

  /** Default listing duration in days */
  DEFAULT_DURATION_DAYS: 30,

  /** Maximum listing duration in days */
  MAX_DURATION_DAYS: 90,
} as const

// ===========================================
// LISTING DURATIONS
// ===========================================

export const LISTING_DURATIONS = [
  { value: 7, label: '7 days' },
  { value: 14, label: '14 days' },
  { value: 30, label: '30 days (recommended)' },
  { value: 60, label: '60 days' },
  { value: 90, label: '90 days' },
] as const

// ===========================================
// SHIPPING
// ===========================================

export const SHIPPING = {
  /** Maximum shipping cost in cents ($100) */
  MAX_SHIPPING_CENTS: 10000,

  /** Default country code */
  DEFAULT_COUNTRY: 'US',

  /** Maximum distance for "nearby" in miles */
  MAX_DISTANCE_MILES: 500,

  /** Default distance for local pickup in miles */
  DEFAULT_LOCAL_DISTANCE_MILES: 25,
} as const

// ===========================================
// PAGINATION
// ===========================================

export const MARKETPLACE_PAGINATION = {
  /** Default listings per page */
  LISTINGS_PAGE_SIZE: 24,

  /** Maximum listings per page */
  MAX_LISTINGS_PAGE_SIZE: 100,

  /** Messages per conversation load */
  MESSAGES_PAGE_SIZE: 50,

  /** Offers per page */
  OFFERS_PAGE_SIZE: 20,

  /** Transactions per page */
  TRANSACTIONS_PAGE_SIZE: 20,

  /** Feedback per page */
  FEEDBACK_PAGE_SIZE: 20,
} as const

// ===========================================
// OFFERS
// ===========================================

export const OFFER_SETTINGS = {
  /** Hours before offer expires */
  DEFAULT_EXPIRY_HOURS: 48,

  /** Maximum offer expiry in hours */
  MAX_EXPIRY_HOURS: 168, // 7 days

  /** Maximum counter offers in a chain */
  MAX_COUNTER_CHAIN: 10,

  /** Maximum games to offer in a trade */
  MAX_TRADE_GAMES: 10,

  /** Maximum message length */
  MAX_MESSAGE_LENGTH: 1000,
} as const

// ===========================================
// TRANSACTIONS
// ===========================================

export const TRANSACTION_SETTINGS = {
  /** Days to auto-release funds after delivery (if buyer doesn't confirm) */
  AUTO_RELEASE_DAYS: 7,

  /** Days before transaction can be disputed */
  DISPUTE_WINDOW_DAYS: 14,
} as const

// ===========================================
// IMAGE UPLOAD
// ===========================================

export const LISTING_IMAGE_UPLOAD = {
  /** Maximum file size in bytes (10MB for listings - higher than profile) */
  MAX_FILE_SIZE: 10 * 1024 * 1024,

  /** Allowed MIME types */
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'] as const,

  /** Minimum dimension for listing images */
  MIN_DIMENSION: 300,

  /** Recommended dimension for quality */
  RECOMMENDED_DIMENSION: 1200,

  /** Storage bucket name */
  STORAGE_BUCKET: 'listing-images',
} as const

// ===========================================
// UI DEFAULTS
// ===========================================

export const MARKETPLACE_UI = {
  /** Grid columns on different breakpoints */
  GRID_COLS: {
    mobile: 1,
    sm: 2,
    md: 2,
    lg: 3,
    xl: 4,
  },

  /** Thumbnail dimensions for cards */
  THUMBNAIL_SIZE: 300,

  /** Card aspect ratio (width:height) */
  CARD_ASPECT_RATIO: 1,
} as const

// ===========================================
// FILTER DEFAULTS
// ===========================================

export const MARKETPLACE_FILTERS = {
  /** Default price range */
  PRICE: {
    MIN: 0,
    MAX: 500,
    STEP: 5,
  },

  /** Distance range for local pickup */
  DISTANCE: {
    MIN: 5,
    MAX: 100,
    DEFAULT: 25,
    STEP: 5,
  },
} as const

// ===========================================
// FEATURE FLAGS
// ===========================================

export const FEATURE_FLAG_KEYS = {
  MARKETPLACE_ENABLED: 'marketplace_enabled',
  MARKETPLACE_BETA: 'marketplace_beta_access',
} as const

// ===========================================
// FEEDBACK & REPUTATION
// ===========================================

export const FEEDBACK_SETTINGS = {
  /** Minimum rating */
  MIN_RATING: 1,

  /** Maximum rating */
  MAX_RATING: 5,

  /** Maximum comment length */
  MAX_COMMENT_LENGTH: 1000,

  /** Sales required for "established" trust level */
  ESTABLISHED_THRESHOLD: 1,

  /** Sales required for "trusted" trust level */
  TRUSTED_THRESHOLD: 5,

  /** Minimum rating for "trusted" trust level */
  TRUSTED_MIN_RATING: 4.0,

  /** Sales required for "top_seller" trust level */
  TOP_SELLER_THRESHOLD: 20,

  /** Minimum rating for "top_seller" trust level */
  TOP_SELLER_MIN_RATING: 4.5,
} as const
