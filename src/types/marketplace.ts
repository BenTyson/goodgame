/**
 * Marketplace Types
 *
 * Type definitions for the Buy/Sell/Trade marketplace.
 * These types match the database schema defined in migrations 00039-00045.
 */

import type { Game, UserProfile } from './database'

// ===========================================
// ENUMS (match database enum types)
// ===========================================

export type ListingType = 'sell' | 'trade' | 'want'

export type ListingStatus =
  | 'draft'
  | 'active'
  | 'pending'
  | 'sold'
  | 'traded'
  | 'expired'
  | 'cancelled'

export type GameCondition =
  | 'new_sealed'
  | 'like_new'
  | 'very_good'
  | 'good'
  | 'acceptable'

export type ShippingPreference = 'local_only' | 'will_ship' | 'ship_only'

export type OfferStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'countered'
  | 'expired'
  | 'withdrawn'

export type TransactionStatus =
  | 'pending_payment'
  | 'payment_processing'
  | 'payment_held'
  | 'shipped'
  | 'delivered'
  | 'completed'
  | 'refund_requested'
  | 'refunded'
  | 'disputed'
  | 'cancelled'

// ===========================================
// CONDITION DISPLAY INFO
// ===========================================

export interface ConditionInfo {
  label: string
  description: string
  color: string // Tailwind color class
}

export const CONDITION_INFO: Record<GameCondition, ConditionInfo> = {
  new_sealed: {
    label: 'New (Sealed)',
    description: 'Factory sealed, never opened',
    color: 'bg-green-500',
  },
  like_new: {
    label: 'Like New',
    description: 'Played 1-2 times, mint condition components',
    color: 'bg-teal-500',
  },
  very_good: {
    label: 'Very Good',
    description: 'Light wear, all components present and functional',
    color: 'bg-blue-500',
  },
  good: {
    label: 'Good',
    description: 'Moderate wear, complete and playable',
    color: 'bg-yellow-500',
  },
  acceptable: {
    label: 'Acceptable',
    description: 'Heavy wear or minor damage, fully playable',
    color: 'bg-orange-500',
  },
}

// ===========================================
// LISTING STATUS DISPLAY INFO
// ===========================================

export interface StatusInfo {
  label: string
  color: string
}

export const LISTING_STATUS_INFO: Record<ListingStatus, StatusInfo> = {
  draft: { label: 'Draft', color: 'bg-gray-400' },
  active: { label: 'Active', color: 'bg-green-500' },
  pending: { label: 'Pending', color: 'bg-yellow-500' },
  sold: { label: 'Sold', color: 'bg-blue-500' },
  traded: { label: 'Traded', color: 'bg-purple-500' },
  expired: { label: 'Expired', color: 'bg-gray-400' },
  cancelled: { label: 'Cancelled', color: 'bg-red-400' },
}

// ===========================================
// CORE TYPES
// ===========================================

/**
 * Marketplace Listing
 * A game listed for sale, trade, or wanted
 */
export interface MarketplaceListing {
  id: string
  seller_id: string
  game_id: string

  // Listing details
  listing_type: ListingType
  title: string | null // Optional custom title
  description: string | null
  condition: GameCondition | null

  // Pricing (for sell listings)
  price_cents: number | null
  currency: string
  accepts_offers: boolean
  minimum_offer_cents: number | null

  // Trade preferences
  trade_preferences: string | null
  trade_game_ids: string[] | null

  // Shipping
  shipping_preference: ShippingPreference
  shipping_cost_cents: number | null
  shipping_notes: string | null

  // Location
  location_city: string | null
  location_state: string | null
  location_country: string
  location_postal: string | null
  location_lat: number | null
  location_lng: number | null

  // Status
  status: ListingStatus
  is_featured: boolean
  view_count: number
  save_count: number

  // Expiration
  expires_at: string | null

  // Timestamps
  published_at: string | null
  sold_at: string | null
  created_at: string
  updated_at: string
}

/**
 * Fields required when creating a listing
 */
export type MarketplaceListingInsert = {
  // Required fields
  seller_id: string
  game_id: string
  listing_type: ListingType
  shipping_preference: ShippingPreference

  // Optional fields (will use defaults or null)
  title?: string | null
  description?: string | null
  condition?: GameCondition | null
  price_cents?: number | null
  currency?: string
  accepts_offers?: boolean
  minimum_offer_cents?: number | null
  trade_preferences?: string | null
  trade_game_ids?: string[] | null
  shipping_cost_cents?: number | null
  shipping_notes?: string | null
  location_city?: string | null
  location_state?: string | null
  location_country?: string
  location_postal?: string | null
  location_lat?: number | null
  location_lng?: number | null
  status?: ListingStatus
  expires_at?: string | null
  published_at?: string | null
  sold_at?: string | null
}

export type MarketplaceListingUpdate = Partial<Omit<MarketplaceListingInsert, 'seller_id' | 'game_id'>>

/**
 * Listing Image
 * Photos attached to a listing
 */
export interface ListingImage {
  id: string
  listing_id: string
  url: string
  storage_path: string | null
  alt_text: string | null
  width: number | null
  height: number | null
  file_size: number | null
  mime_type: string | null
  display_order: number
  is_primary: boolean
  created_at: string
}

export type ListingImageInsert = Omit<ListingImage, 'id' | 'created_at'>
export type ListingImageUpdate = Partial<ListingImageInsert>

/**
 * User Marketplace Settings
 * User's marketplace preferences and Stripe Connect info
 */
export interface UserMarketplaceSettings {
  id: string
  user_id: string

  // Stripe Connect
  stripe_account_id: string | null
  stripe_account_status: 'pending' | 'active' | 'restricted' | 'disabled' | null
  stripe_onboarding_complete: boolean
  stripe_charges_enabled: boolean
  stripe_payouts_enabled: boolean

  // Default shipping settings
  default_shipping_preference: ShippingPreference
  ships_from_location: string | null
  ships_to_countries: string[] | null

  // Pickup location
  pickup_location_city: string | null
  pickup_location_state: string | null
  pickup_location_country: string
  pickup_location_postal: string | null
  pickup_location_lat: number | null
  pickup_location_lng: number | null

  // Notification preferences
  notification_preferences: {
    new_offer: boolean
    offer_accepted: boolean
    offer_declined: boolean
    message: boolean
    listing_expiring: boolean
    payment_received: boolean
    feedback_received: boolean
  }

  // Stats (denormalized)
  total_sales: number
  total_purchases: number
  total_trades: number
  seller_rating: number | null
  buyer_rating: number | null

  // Timestamps
  created_at: string
  updated_at: string
}

// ===========================================
// EXTENDED TYPES (with relations)
// ===========================================

/**
 * Listing with game and seller info for display
 */
export interface ListingWithDetails extends MarketplaceListing {
  game: Pick<Game, 'id' | 'name' | 'slug' | 'box_image_url' | 'thumbnail_url' | 'player_count_min' | 'player_count_max' | 'play_time_min' | 'play_time_max'>
  seller: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'>
  images?: ListingImage[]
  offer_count?: number
  // Seller reputation (from marketplace settings)
  seller_rating?: number | null
  seller_sales_count?: number
}

/**
 * Listing card display type (minimal for grids)
 */
export interface ListingCardData {
  id: string
  listing_type: ListingType
  status: ListingStatus
  condition: GameCondition | null
  price_cents: number | null
  currency: string
  shipping_cost_cents: number | null
  shipping_preference: ShippingPreference
  location_city: string | null
  location_state: string | null
  expires_at: string | null
  created_at: string

  // Game info
  game_id: string
  game_name: string
  game_slug: string
  game_image: string | null

  // Seller info
  seller_id: string
  seller_username: string | null
  seller_display_name: string | null
  seller_avatar: string | null
  seller_rating: number | null
  seller_sales_count: number

  // Primary listing image (if different from game image)
  primary_image_url: string | null
}

// ===========================================
// FILTER TYPES
// ===========================================

export interface ListingFilters {
  // Search
  query?: string

  // Type filters
  listing_types?: ListingType[]
  conditions?: GameCondition[]

  // Price range
  price_min_cents?: number
  price_max_cents?: number

  // Location
  shipping_preferences?: ShippingPreference[]
  location_postal?: string
  max_distance_miles?: number

  // Specific games
  game_ids?: string[]
  category_ids?: string[]

  // Seller
  seller_id?: string

  // Sorting
  sort_by?: 'newest' | 'price_low' | 'price_high' | 'distance' | 'ending_soon'

  // Pagination
  limit?: number
  offset?: number
}

// ===========================================
// FEATURE FLAGS
// ===========================================

export interface FeatureFlag {
  id: string
  flag_key: string
  is_enabled: boolean
  allowed_user_ids: string[]
  metadata: Record<string, unknown>
  created_at: string
  updated_at: string
}

// Known feature flag keys
export type MarketplaceFeatureFlag =
  | 'marketplace_enabled'
  | 'marketplace_beta_access'

// ===========================================
// API RESPONSE TYPES
// ===========================================

export interface ListingsResponse {
  listings: ListingCardData[]
  total: number
  hasMore: boolean
}

export interface CreateListingRequest {
  game_id: string
  listing_type: ListingType
  condition?: GameCondition
  description?: string
  price_cents?: number
  currency?: string
  accepts_offers?: boolean
  minimum_offer_cents?: number
  trade_preferences?: string
  trade_game_ids?: string[]
  shipping_preference: ShippingPreference
  shipping_cost_cents?: number
  shipping_notes?: string
  location_postal: string
  duration_days?: 30 | 60 | 90
}

export interface CreateListingResponse {
  listing: MarketplaceListing
  images_upload_urls?: string[] // Pre-signed URLs for image upload
}

// ===========================================
// OFFER TYPES
// ===========================================

export type OfferType = 'buy' | 'trade' | 'buy_plus_trade'

/**
 * Marketplace Offer
 * An offer on a listing (buy, trade, or both)
 */
export interface MarketplaceOffer {
  id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  conversation_id: string | null

  // Offer details
  offer_type: OfferType
  amount_cents: number | null
  currency: string
  trade_game_ids: string[]
  trade_notes: string | null

  // Counter-offer chain
  parent_offer_id: string | null
  counter_count: number

  // Status
  status: OfferStatus
  message: string | null
  response_message: string | null
  responded_at: string | null
  responded_by: string | null

  // Expiration
  expires_at: string

  // Timestamps
  created_at: string
  updated_at: string
}

export type MarketplaceOfferInsert = {
  listing_id: string
  buyer_id: string
  seller_id: string
  offer_type: OfferType
  amount_cents?: number | null
  currency?: string
  trade_game_ids?: string[]
  trade_notes?: string | null
  conversation_id?: string | null
  message?: string | null
  expires_at?: string
}

export type MarketplaceOfferUpdate = Partial<
  Pick<MarketplaceOffer, 'status' | 'response_message' | 'responded_at' | 'responded_by'>
>

/**
 * Offer with related data for display
 */
export interface OfferWithDetails extends MarketplaceOffer {
  // Buyer info
  buyer: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'>
  // Seller info
  seller: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'>
  // Listing info
  listing: Pick<MarketplaceListing, 'id' | 'listing_type' | 'price_cents' | 'currency' | 'status'> & {
    game: Pick<Game, 'id' | 'name' | 'slug' | 'thumbnail_url'>
  }
  // Trade games (if any)
  trade_games?: Pick<Game, 'id' | 'name' | 'slug' | 'thumbnail_url'>[]
}

/**
 * Offer card display type (minimal for lists)
 */
export interface OfferCardData {
  id: string
  listing_id: string
  offer_type: OfferType
  amount_cents: number | null
  currency: string
  status: OfferStatus
  message: string | null
  expires_at: string
  created_at: string
  counter_count: number
  trade_game_count: number

  // Listing info
  game_name: string
  game_slug: string
  game_image: string | null
  listing_price_cents: number | null

  // Other party info (buyer if viewing as seller, seller if viewing as buyer)
  other_user_id: string
  other_user_username: string | null
  other_user_display_name: string | null
  other_user_avatar: string | null
}

// ===========================================
// OFFER STATUS DISPLAY INFO
// ===========================================

export interface OfferStatusInfo {
  label: string
  color: string
  bgColor: string
  description: string
}

export const OFFER_STATUS_INFO: Record<OfferStatus, OfferStatusInfo> = {
  pending: {
    label: 'Pending',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    description: 'Awaiting response',
  },
  accepted: {
    label: 'Accepted',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: 'Offer accepted',
  },
  declined: {
    label: 'Declined',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Offer declined',
  },
  countered: {
    label: 'Countered',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Counter-offer made',
  },
  expired: {
    label: 'Expired',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    description: 'Offer expired',
  },
  withdrawn: {
    label: 'Withdrawn',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    description: 'Offer withdrawn by buyer',
  },
}

export const OFFER_TYPE_INFO: Record<OfferType, { label: string; icon: string }> = {
  buy: { label: 'Cash Offer', icon: 'DollarSign' },
  trade: { label: 'Trade Offer', icon: 'ArrowLeftRight' },
  buy_plus_trade: { label: 'Cash + Trade', icon: 'Handshake' },
}

// ===========================================
// OFFER API TYPES
// ===========================================

export interface CreateOfferRequest {
  listing_id: string
  offer_type: OfferType
  amount_cents?: number
  trade_game_ids?: string[]
  trade_notes?: string
  message?: string
}

export interface OfferActionRequest {
  action: 'accept' | 'decline' | 'counter' | 'withdraw'
  message?: string
  // For counter-offers
  counter_amount_cents?: number
  counter_trade_game_ids?: string[]
}

export interface OffersResponse {
  offers: OfferCardData[]
  total: number
  hasMore: boolean
}

// ===========================================
// TRANSACTION TYPES
// ===========================================

/**
 * Shipping carriers for tracking
 */
export type ShippingCarrier =
  | 'usps'
  | 'ups'
  | 'fedex'
  | 'dhl'
  | 'other'

export const SHIPPING_CARRIERS: Record<ShippingCarrier, { label: string; trackingUrl: string }> = {
  usps: {
    label: 'USPS',
    trackingUrl: 'https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=',
  },
  ups: {
    label: 'UPS',
    trackingUrl: 'https://www.ups.com/track?tracknum=',
  },
  fedex: {
    label: 'FedEx',
    trackingUrl: 'https://www.fedex.com/fedextrack/?trknbr=',
  },
  dhl: {
    label: 'DHL',
    trackingUrl: 'https://www.dhl.com/en/express/tracking.html?AWB=',
  },
  other: {
    label: 'Other',
    trackingUrl: '',
  },
}

/**
 * Marketplace Transaction
 * Links an accepted offer to payment and fulfillment
 */
export interface MarketplaceTransaction {
  id: string
  offer_id: string
  listing_id: string
  buyer_id: string
  seller_id: string

  // Stripe
  stripe_payment_intent_id: string | null
  stripe_charge_id: string | null
  stripe_transfer_id: string | null
  stripe_checkout_session_id: string | null

  // Amounts (all in cents)
  amount_cents: number
  shipping_cents: number
  platform_fee_cents: number
  stripe_fee_cents: number
  seller_payout_cents: number
  currency: string

  // Status
  status: TransactionStatus

  // Shipping
  shipping_carrier: ShippingCarrier | null
  tracking_number: string | null
  shipped_at: string | null
  delivered_at: string | null

  // Timestamps
  paid_at: string | null
  released_at: string | null
  created_at: string
  updated_at: string
}

export type MarketplaceTransactionInsert = {
  offer_id: string
  listing_id: string
  buyer_id: string
  seller_id: string
  amount_cents: number
  shipping_cents?: number
  platform_fee_cents: number
  stripe_fee_cents: number
  seller_payout_cents: number
  currency?: string
  status?: TransactionStatus
}

export type MarketplaceTransactionUpdate = Partial<
  Pick<
    MarketplaceTransaction,
    | 'stripe_payment_intent_id'
    | 'stripe_charge_id'
    | 'stripe_transfer_id'
    | 'stripe_checkout_session_id'
    | 'status'
    | 'shipping_carrier'
    | 'tracking_number'
    | 'shipped_at'
    | 'delivered_at'
    | 'paid_at'
    | 'released_at'
  >
>

/**
 * Transaction with related data for display
 */
export interface TransactionWithDetails extends MarketplaceTransaction {
  // Offer info
  offer: Pick<MarketplaceOffer, 'id' | 'offer_type' | 'amount_cents' | 'trade_game_ids'>
  // Listing info
  listing: Pick<MarketplaceListing, 'id' | 'listing_type' | 'title' | 'status'> & {
    game: Pick<Game, 'id' | 'name' | 'slug' | 'thumbnail_url' | 'box_image_url'>
  }
  // Buyer info
  buyer: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'>
  // Seller info
  seller: Pick<UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'>
}

/**
 * Transaction card display type (minimal for lists)
 */
export interface TransactionCardData {
  id: string
  status: TransactionStatus
  amount_cents: number
  shipping_cents: number
  currency: string
  created_at: string
  paid_at: string | null
  shipped_at: string | null
  delivered_at: string | null
  tracking_number: string | null
  shipping_carrier: ShippingCarrier | null

  // Listing info
  listing_id: string
  game_name: string
  game_slug: string
  game_image: string | null

  // Other party info (buyer if viewing as seller, seller if viewing as buyer)
  other_user_id: string
  other_user_username: string | null
  other_user_display_name: string | null
  other_user_avatar: string | null

  // Role context
  role: 'buyer' | 'seller'
}

// ===========================================
// TRANSACTION STATUS DISPLAY INFO
// ===========================================

export interface TransactionStatusInfo {
  label: string
  color: string
  bgColor: string
  description: string
  buyerAction?: string
  sellerAction?: string
}

export const TRANSACTION_STATUS_INFO: Record<TransactionStatus, TransactionStatusInfo> = {
  pending_payment: {
    label: 'Pending Payment',
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-100',
    description: 'Awaiting buyer payment',
    buyerAction: 'Complete payment',
    sellerAction: 'Waiting for buyer to pay',
  },
  payment_processing: {
    label: 'Processing',
    color: 'text-blue-700',
    bgColor: 'bg-blue-100',
    description: 'Payment being processed',
    buyerAction: 'Payment processing',
    sellerAction: 'Payment processing',
  },
  payment_held: {
    label: 'Payment Held',
    color: 'text-teal-700',
    bgColor: 'bg-teal-100',
    description: 'Payment secured, ready to ship',
    buyerAction: 'Waiting for seller to ship',
    sellerAction: 'Ship the item and add tracking',
  },
  shipped: {
    label: 'Shipped',
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-100',
    description: 'Item shipped, in transit',
    buyerAction: 'Confirm when received',
    sellerAction: 'Waiting for delivery confirmation',
  },
  delivered: {
    label: 'Delivered',
    color: 'text-purple-700',
    bgColor: 'bg-purple-100',
    description: 'Item delivered',
    buyerAction: 'Confirm receipt to release payment',
    sellerAction: 'Waiting for buyer confirmation',
  },
  completed: {
    label: 'Completed',
    color: 'text-green-700',
    bgColor: 'bg-green-100',
    description: 'Transaction completed successfully',
  },
  refund_requested: {
    label: 'Refund Requested',
    color: 'text-orange-700',
    bgColor: 'bg-orange-100',
    description: 'Buyer requested a refund',
    buyerAction: 'Refund request submitted',
    sellerAction: 'Review refund request',
  },
  refunded: {
    label: 'Refunded',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    description: 'Payment has been refunded',
  },
  disputed: {
    label: 'Disputed',
    color: 'text-red-700',
    bgColor: 'bg-red-100',
    description: 'Transaction is being disputed',
    buyerAction: 'Dispute in progress',
    sellerAction: 'Dispute in progress',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'text-gray-700',
    bgColor: 'bg-gray-100',
    description: 'Transaction was cancelled',
  },
}

// ===========================================
// TRANSACTION API TYPES
// ===========================================

export interface CreateTransactionRequest {
  offer_id: string
}

export interface TransactionUpdateRequest {
  action: 'add_tracking' | 'mark_shipped' | 'confirm_delivery' | 'request_refund' | 'release_funds'
  shipping_carrier?: ShippingCarrier
  tracking_number?: string
  message?: string
}

export interface TransactionsResponse {
  transactions: TransactionCardData[]
  total: number
  hasMore: boolean
}

export interface CheckoutSessionResponse {
  checkout_url: string
  session_id: string
}

// ===========================================
// STRIPE CONNECT TYPES
// ===========================================

export interface StripeConnectStatus {
  hasAccount: boolean
  accountId: string | null
  isOnboarded: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  detailsSubmitted: boolean
  requiresAction: boolean
}

export interface StripeConnectOnboardingResponse {
  accountId: string
  onboardingUrl: string
}

// ===========================================
// FEEDBACK & REPUTATION TYPES
// ===========================================

/**
 * Feedback role - who is leaving the feedback
 */
export type FeedbackRole = 'buyer' | 'seller'

/**
 * Trust level - based on transaction history and ratings
 */
export type TrustLevel = 'new' | 'established' | 'trusted' | 'top_seller'

/**
 * Trust level display information
 */
export interface TrustLevelInfo {
  label: string
  color: string
  bgColor: string
  description: string
  icon: string
}

export const TRUST_LEVEL_INFO: Record<TrustLevel, TrustLevelInfo> = {
  new: {
    label: 'New Seller',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    description: 'New to the marketplace',
    icon: 'User',
  },
  established: {
    label: 'Established',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    description: '1-4 completed sales',
    icon: 'UserCheck',
  },
  trusted: {
    label: 'Trusted Seller',
    color: 'text-teal-600',
    bgColor: 'bg-teal-100',
    description: '5+ sales with 4+ star rating',
    icon: 'BadgeCheck',
  },
  top_seller: {
    label: 'Top Seller',
    color: 'text-amber-600',
    bgColor: 'bg-amber-100',
    description: '20+ sales with 4.5+ star rating',
    icon: 'Award',
  },
}

/**
 * Marketplace Feedback
 * Rating and review for a completed transaction
 */
export interface MarketplaceFeedback {
  id: string
  transaction_id: string
  reviewer_id: string
  reviewee_id: string
  role: FeedbackRole
  rating: number // 1-5
  comment: string | null
  is_positive: boolean
  created_at: string
  updated_at: string
}

export type MarketplaceFeedbackInsert = {
  transaction_id: string
  reviewer_id: string
  reviewee_id: string
  role: FeedbackRole
  rating: number
  comment?: string | null
}

/**
 * Feedback with reviewer details for display
 */
export interface FeedbackWithDetails extends MarketplaceFeedback {
  reviewer: Pick<import('./database').UserProfile, 'id' | 'username' | 'display_name' | 'avatar_url' | 'custom_avatar_url'>
  game_name: string
  game_slug: string
  game_image: string | null
}

/**
 * User reputation statistics
 */
export interface UserReputationStats {
  user_id: string
  // As seller stats
  seller_feedback_count: number
  seller_rating: number | null
  seller_five_star_count: number
  seller_positive_count: number
  seller_negative_count: number
  // As buyer stats
  buyer_feedback_count: number
  buyer_rating: number | null
  // Combined
  total_feedback_count: number
  overall_rating: number | null
  trust_level: TrustLevel
  // From marketplace settings
  total_sales: number
  total_purchases: number
}

/**
 * Feedback ability check result
 */
export interface FeedbackAbility {
  can_leave: boolean
  reason: string | null
  already_left: boolean
  role: FeedbackRole | null
}

// ===========================================
// FEEDBACK API TYPES
// ===========================================

export interface CreateFeedbackRequest {
  transaction_id: string
  rating: number
  comment?: string
}

export interface FeedbackResponse {
  feedback: FeedbackWithDetails[]
  total: number
  hasMore: boolean
}

export interface ReputationResponse {
  reputation: UserReputationStats
  recent_feedback: FeedbackWithDetails[]
}

// ===========================================
// DISCOVERY & ALERTS TYPES (PHASE 6)
// ===========================================

/**
 * Alert frequency options
 */
export type AlertFrequency = 'instant' | 'daily' | 'weekly'

/**
 * Alert status
 */
export type AlertStatus = 'active' | 'paused' | 'expired'

/**
 * Saved search filters structure
 */
export interface SavedSearchFilters {
  query?: string
  listing_types?: ListingType[]
  conditions?: GameCondition[]
  price_min_cents?: number
  price_max_cents?: number
  shipping_preferences?: ShippingPreference[]
  game_ids?: string[]
  category_ids?: string[]
  location_postal?: string
  max_distance_miles?: number
  verified_sellers_only?: boolean
}

/**
 * Saved search
 */
export interface SavedSearch {
  id: string
  user_id: string
  name: string
  filters: SavedSearchFilters
  alerts_enabled: boolean
  alert_frequency: AlertFrequency
  alert_email: boolean
  alert_push: boolean
  status: AlertStatus
  last_match_at: string | null
  match_count: number
  last_notified_at: string | null
  created_at: string
  updated_at: string
}

export type SavedSearchInsert = {
  name: string
  filters: SavedSearchFilters
  alert_frequency?: AlertFrequency
  alert_email?: boolean
}

export type SavedSearchUpdate = Partial<
  Pick<SavedSearch, 'name' | 'filters' | 'alerts_enabled' | 'alert_frequency' | 'alert_email' | 'status'>
>

/**
 * Wishlist alert
 */
export interface WishlistAlert {
  id: string
  user_id: string
  game_id: string
  alerts_enabled: boolean
  max_price_cents: number | null
  accepted_conditions: GameCondition[]
  local_only: boolean
  max_distance_miles: number | null
  status: AlertStatus
  last_match_at: string | null
  match_count: number
  last_notified_at: string | null
  created_at: string
  updated_at: string
}

export type WishlistAlertInsert = {
  game_id: string
  max_price_cents?: number | null
  accepted_conditions?: GameCondition[]
  local_only?: boolean
  max_distance_miles?: number | null
}

export type WishlistAlertUpdate = Partial<
  Pick<WishlistAlert, 'alerts_enabled' | 'max_price_cents' | 'accepted_conditions' | 'local_only' | 'max_distance_miles' | 'status'>
>

/**
 * Wishlist alert with game info for display
 */
export interface WishlistAlertWithGame extends WishlistAlert {
  game_name: string
  game_slug: string
  game_image: string | null
}

/**
 * Alert notification record
 */
export interface AlertNotification {
  id: string
  saved_search_id: string | null
  wishlist_alert_id: string | null
  listing_id: string
  user_id: string
  sent_at: string
  email_sent: boolean
  push_sent: boolean
}

/**
 * Similar listing with score
 */
export interface SimilarListing {
  listing_id: string
  similarity_score: number
}

// ===========================================
// DISCOVERY API TYPES
// ===========================================

export interface SavedSearchResponse {
  savedSearches: SavedSearch[]
  total: number
}

export interface CreateSavedSearchRequest {
  name: string
  filters: SavedSearchFilters
  alert_frequency?: AlertFrequency
  alert_email?: boolean
}

export interface UpdateSavedSearchRequest {
  name?: string
  filters?: SavedSearchFilters
  alerts_enabled?: boolean
  alert_frequency?: AlertFrequency
  alert_email?: boolean
}

export interface WishlistAlertsResponse {
  alerts: WishlistAlertWithGame[]
  total: number
}

export interface CreateWishlistAlertRequest {
  game_id: string
  max_price_cents?: number
  accepted_conditions?: GameCondition[]
  local_only?: boolean
  max_distance_miles?: number
}

export interface UpdateWishlistAlertRequest {
  alerts_enabled?: boolean
  max_price_cents?: number | null
  accepted_conditions?: GameCondition[]
  local_only?: boolean
  max_distance_miles?: number | null
}

export interface SimilarListingsResponse {
  listings: ListingCardData[]
}

// ===========================================
// ALERT FREQUENCY DISPLAY INFO
// ===========================================

export interface AlertFrequencyInfo {
  label: string
  description: string
}

export const ALERT_FREQUENCY_INFO: Record<AlertFrequency, AlertFrequencyInfo> = {
  instant: {
    label: 'Instant',
    description: 'Get notified immediately when a match is found',
  },
  daily: {
    label: 'Daily Digest',
    description: 'Receive a daily summary of all matches',
  },
  weekly: {
    label: 'Weekly Digest',
    description: 'Receive a weekly summary of all matches',
  },
}

export const ALERT_STATUS_INFO: Record<AlertStatus, { label: string; color: string }> = {
  active: { label: 'Active', color: 'bg-green-500' },
  paused: { label: 'Paused', color: 'bg-yellow-500' },
  expired: { label: 'Expired', color: 'bg-gray-400' },
}

// ===========================================
// SELLER DASHBOARD TYPES (PHASE 7)
// ===========================================

/**
 * Action required item types
 */
export type ActionRequiredType =
  | 'offer_pending'
  | 'transaction_ship'
  | 'feedback_pending'
  | 'listing_expiring'

/**
 * Action urgency levels
 */
export type ActionUrgency = 'high' | 'medium' | 'low'

/**
 * Action required item for dashboard
 */
export interface ActionRequiredItem {
  type: ActionRequiredType
  id: string
  title: string
  subtitle: string
  urgency: ActionUrgency
  expiresAt?: string
  ctaLabel: string
  ctaHref: string
  // Extra data for inline actions
  offerId?: string
  transactionId?: string
  listingId?: string
  gameImage?: string | null
  otherUserName?: string | null
  otherUserAvatar?: string | null
  amountCents?: number | null
}

/**
 * Dashboard stats for seller overview
 */
export interface SellerDashboardStats {
  activeListings: number
  pendingOffers: number
  actionRequired: number
  unreadMessages: number
  totalEarningsCents: number
  rating: number | null
  feedbackCount: number
  trustLevel: TrustLevel
  totalSales: number
}

/**
 * Stripe onboarding status for dashboard
 */
export interface DashboardStripeStatus {
  connected: boolean
  onboardingComplete: boolean
  chargesEnabled: boolean
  payoutsEnabled: boolean
  requiresAction: boolean
}

/**
 * Complete seller dashboard data
 */
export interface SellerDashboardData {
  stats: SellerDashboardStats
  stripeStatus: DashboardStripeStatus
  actionItems: ActionRequiredItem[]
  // Recent data for tabs (pre-loaded)
  recentOffers: OfferCardData[]
  recentTransactions: TransactionCardData[]
  listings: ListingCardData[]
}
