-- Migration: Marketplace Listings
-- Core listing tables for the Buy/Sell/Trade marketplace

-- ============================================
-- ENUM TYPES
-- ============================================

-- What type of listing is this?
CREATE TYPE listing_type AS ENUM (
  'sell',   -- Selling for money
  'trade',  -- Trading for other games
  'want'    -- Looking for this game
);

-- Listing lifecycle status
CREATE TYPE listing_status AS ENUM (
  'draft',      -- Not yet published
  'active',     -- Currently visible and available
  'pending',    -- Transaction in progress
  'sold',       -- Successfully sold
  'traded',     -- Successfully traded
  'expired',    -- Auto-expired after duration
  'cancelled'   -- Manually cancelled by seller
);

-- Physical condition of the game
CREATE TYPE game_condition AS ENUM (
  'new_sealed',   -- Factory sealed, never opened
  'like_new',     -- Played 1-2 times, mint condition
  'very_good',    -- Light wear, all components present
  'good',         -- Moderate wear, complete and playable
  'acceptable'    -- Heavy wear or minor damage, playable
);

-- How the seller wants to fulfill the sale
CREATE TYPE shipping_preference AS ENUM (
  'local_only',   -- Local pickup only
  'will_ship',    -- Willing to ship (default)
  'ship_only'     -- Shipping only, no local pickup
);

-- ============================================
-- USER MARKETPLACE SETTINGS
-- ============================================
-- User's marketplace preferences, location, and future Stripe Connect info

CREATE TABLE user_marketplace_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE UNIQUE,

  -- Stripe Connect (for future Phase 4)
  stripe_account_id VARCHAR(100),
  stripe_account_status VARCHAR(50) DEFAULT 'pending',
  stripe_onboarding_complete BOOLEAN DEFAULT FALSE,
  stripe_charges_enabled BOOLEAN DEFAULT FALSE,
  stripe_payouts_enabled BOOLEAN DEFAULT FALSE,

  -- Default shipping settings
  default_shipping_preference shipping_preference DEFAULT 'will_ship',
  ships_from_location VARCHAR(200),
  ships_to_countries TEXT[] DEFAULT ARRAY['US'],

  -- Pickup location for local sales
  pickup_location_city VARCHAR(100),
  pickup_location_state VARCHAR(100),
  pickup_location_country VARCHAR(100) DEFAULT 'US',
  pickup_location_postal VARCHAR(20),
  pickup_location_lat DECIMAL(10, 8),
  pickup_location_lng DECIMAL(11, 8),

  -- Notification preferences
  notification_preferences JSONB DEFAULT '{
    "new_offer": true,
    "offer_accepted": true,
    "offer_declined": true,
    "message": true,
    "listing_expiring": true,
    "payment_received": true,
    "feedback_received": true
  }',

  -- Denormalized stats for quick display
  total_sales INTEGER DEFAULT 0,
  total_purchases INTEGER DEFAULT 0,
  total_trades INTEGER DEFAULT 0,
  seller_rating DECIMAL(3, 2),
  buyer_rating DECIMAL(3, 2),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE UNIQUE INDEX idx_marketplace_settings_user ON user_marketplace_settings(user_id);
CREATE INDEX idx_marketplace_settings_stripe ON user_marketplace_settings(stripe_account_id)
  WHERE stripe_account_id IS NOT NULL;
CREATE INDEX idx_marketplace_settings_location ON user_marketplace_settings(pickup_location_lat, pickup_location_lng)
  WHERE pickup_location_lat IS NOT NULL;

-- Trigger for updated_at
CREATE TRIGGER update_marketplace_settings_updated_at
  BEFORE UPDATE ON user_marketplace_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE user_marketplace_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own marketplace settings"
  ON user_marketplace_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own marketplace settings"
  ON user_marketplace_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own marketplace settings"
  ON user_marketplace_settings FOR UPDATE
  USING (auth.uid() = user_id);

-- Public can view basic seller info (rating, sales count) - controlled at query level
CREATE POLICY "Public can view seller stats"
  ON user_marketplace_settings FOR SELECT
  USING (true);

-- ============================================
-- MARKETPLACE LISTINGS
-- ============================================

CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

  -- Listing type and status
  listing_type listing_type NOT NULL,
  status listing_status DEFAULT 'draft',

  -- Optional custom title (defaults to game name)
  title VARCHAR(200),

  -- Condition (required for sell/trade, null for want)
  condition game_condition,
  condition_notes TEXT,

  -- Description
  description TEXT,

  -- Pricing (for sell listings)
  price_cents INTEGER CHECK (price_cents >= 100 AND price_cents <= 1000000),
  currency VARCHAR(3) DEFAULT 'USD',
  accepts_offers BOOLEAN DEFAULT TRUE,
  minimum_offer_cents INTEGER CHECK (minimum_offer_cents >= 0),

  -- Trade preferences (for trade listings)
  trade_preferences TEXT,
  trade_game_ids UUID[],

  -- Shipping settings
  shipping_preference shipping_preference DEFAULT 'will_ship',
  shipping_cost_cents INTEGER CHECK (shipping_cost_cents >= 0 AND shipping_cost_cents <= 10000),
  shipping_notes TEXT,

  -- Location (denormalized for search)
  location_city VARCHAR(100),
  location_state VARCHAR(100),
  location_country VARCHAR(100) DEFAULT 'US',
  location_postal VARCHAR(20),
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),

  -- Visibility & engagement
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INTEGER DEFAULT 0,
  save_count INTEGER DEFAULT 0,

  -- Expiration
  expires_at TIMESTAMPTZ,

  -- Timestamps
  published_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for common queries
CREATE INDEX idx_listings_seller ON marketplace_listings(seller_id);
CREATE INDEX idx_listings_game ON marketplace_listings(game_id);
CREATE INDEX idx_listings_type ON marketplace_listings(listing_type);
CREATE INDEX idx_listings_status ON marketplace_listings(status);

-- Composite index for browse queries
CREATE INDEX idx_listings_active_browse ON marketplace_listings(status, listing_type, published_at DESC)
  WHERE status = 'active';

-- Location-based search
CREATE INDEX idx_listings_location ON marketplace_listings(location_lat, location_lng)
  WHERE location_lat IS NOT NULL AND status = 'active';

-- Price filtering
CREATE INDEX idx_listings_price ON marketplace_listings(price_cents)
  WHERE listing_type = 'sell' AND status = 'active';

-- Expiration checking
CREATE INDEX idx_listings_expires ON marketplace_listings(expires_at)
  WHERE status = 'active' AND expires_at IS NOT NULL;

-- Full-text search
ALTER TABLE marketplace_listings ADD COLUMN fts tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('english', COALESCE(title, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(condition_notes, '')), 'C')
  ) STORED;

CREATE INDEX idx_listings_fts ON marketplace_listings USING GIN (fts);

-- Trigger for updated_at
CREATE TRIGGER update_listings_updated_at
  BEFORE UPDATE ON marketplace_listings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS
ALTER TABLE marketplace_listings ENABLE ROW LEVEL SECURITY;

-- Anyone can view active listings
CREATE POLICY "Public can view active listings"
  ON marketplace_listings FOR SELECT
  USING (status = 'active' OR auth.uid() = seller_id);

-- Users can create their own listings
CREATE POLICY "Users can create own listings"
  ON marketplace_listings FOR INSERT
  WITH CHECK (auth.uid() = seller_id);

-- Users can update their own listings
CREATE POLICY "Users can update own listings"
  ON marketplace_listings FOR UPDATE
  USING (auth.uid() = seller_id);

-- Users can delete their own draft/cancelled listings
CREATE POLICY "Users can delete own inactive listings"
  ON marketplace_listings FOR DELETE
  USING (auth.uid() = seller_id AND status IN ('draft', 'cancelled'));

-- ============================================
-- LISTING IMAGES
-- ============================================

CREATE TABLE listing_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,

  -- Image details
  url TEXT NOT NULL,
  storage_path VARCHAR(500),
  alt_text VARCHAR(255),

  -- Image metadata
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type VARCHAR(50),

  -- Ordering
  display_order SMALLINT NOT NULL DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_listing_images_listing ON listing_images(listing_id);
CREATE INDEX idx_listing_images_order ON listing_images(listing_id, display_order);

-- Ensure only one primary image per listing
CREATE UNIQUE INDEX idx_listing_images_primary
  ON listing_images(listing_id)
  WHERE is_primary = TRUE;

-- RLS
ALTER TABLE listing_images ENABLE ROW LEVEL SECURITY;

-- Anyone can view images for visible listings
CREATE POLICY "Public can view listing images"
  ON listing_images FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_listings
      WHERE marketplace_listings.id = listing_images.listing_id
        AND (marketplace_listings.status = 'active' OR marketplace_listings.seller_id = auth.uid())
    )
  );

-- Listing owners can manage images
CREATE POLICY "Listing owners can insert images"
  ON listing_images FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM marketplace_listings
      WHERE marketplace_listings.id = listing_images.listing_id
        AND marketplace_listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Listing owners can update images"
  ON listing_images FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_listings
      WHERE marketplace_listings.id = listing_images.listing_id
        AND marketplace_listings.seller_id = auth.uid()
    )
  );

CREATE POLICY "Listing owners can delete images"
  ON listing_images FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM marketplace_listings
      WHERE marketplace_listings.id = listing_images.listing_id
        AND marketplace_listings.seller_id = auth.uid()
    )
  );

-- ============================================
-- LISTING SAVES (Watchlist/Favorites)
-- ============================================

CREATE TABLE listing_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,

  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, listing_id)
);

-- Indexes
CREATE INDEX idx_listing_saves_user ON listing_saves(user_id);
CREATE INDEX idx_listing_saves_listing ON listing_saves(listing_id);

-- RLS
ALTER TABLE listing_saves ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saves"
  ON listing_saves FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own saves"
  ON listing_saves FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saves"
  ON listing_saves FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- ACTIVITY TRIGGERS
-- ============================================

-- Create activity when listing is published
CREATE OR REPLACE FUNCTION create_listing_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create activity when listing is newly published
  IF NEW.status = 'active' AND (OLD IS NULL OR OLD.status != 'active') THEN
    INSERT INTO user_activities (user_id, activity_type, game_id, metadata)
    VALUES (
      NEW.seller_id,
      'listing_created',
      NEW.game_id,
      jsonb_build_object(
        'listing_id', NEW.id,
        'listing_type', NEW.listing_type,
        'price_cents', NEW.price_cents
      )
    );
  END IF;

  -- Activity when sold
  IF NEW.status = 'sold' AND OLD.status != 'sold' THEN
    INSERT INTO user_activities (user_id, activity_type, game_id, metadata)
    VALUES (
      NEW.seller_id,
      'listing_sold',
      NEW.game_id,
      jsonb_build_object('listing_id', NEW.id)
    );
  END IF;

  -- Activity when traded
  IF NEW.status = 'traded' AND OLD.status != 'traded' THEN
    INSERT INTO user_activities (user_id, activity_type, game_id, metadata)
    VALUES (
      NEW.seller_id,
      'listing_traded',
      NEW.game_id,
      jsonb_build_object('listing_id', NEW.id)
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_listing_status_change
  AFTER INSERT OR UPDATE OF status ON marketplace_listings
  FOR EACH ROW
  EXECUTE FUNCTION create_listing_activity();

-- Update save_count on listing when saves change
CREATE OR REPLACE FUNCTION update_listing_save_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE marketplace_listings
    SET save_count = save_count + 1
    WHERE id = NEW.listing_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE marketplace_listings
    SET save_count = save_count - 1
    WHERE id = OLD.listing_id;
    RETURN OLD;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_listing_save_change
  AFTER INSERT OR DELETE ON listing_saves
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_save_count();

-- ============================================
-- STORAGE BUCKET FOR LISTING IMAGES
-- ============================================

-- Create storage bucket for listing images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'listing-images',
  'listing-images',
  true,
  10485760,  -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Storage policies for listing images
-- Path structure: {user_id}/{listing_id}/{filename}

CREATE POLICY "Public can view listing images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'listing-images');

CREATE POLICY "Authenticated users can upload listing images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can update own listing images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "Users can delete own listing images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'listing-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- ============================================
-- HELPER FUNCTION: Distance calculation
-- ============================================

CREATE OR REPLACE FUNCTION calculate_distance_miles(
  lat1 DECIMAL(10, 8),
  lng1 DECIMAL(11, 8),
  lat2 DECIMAL(10, 8),
  lng2 DECIMAL(11, 8)
)
RETURNS DECIMAL AS $$
DECLARE
  R CONSTANT DECIMAL := 3959; -- Earth radius in miles
  dLat DECIMAL;
  dLng DECIMAL;
  a DECIMAL;
  c DECIMAL;
BEGIN
  IF lat1 IS NULL OR lng1 IS NULL OR lat2 IS NULL OR lng2 IS NULL THEN
    RETURN NULL;
  END IF;

  dLat := RADIANS(lat2 - lat1);
  dLng := RADIANS(lng2 - lng1);

  a := SIN(dLat/2) * SIN(dLat/2) +
       COS(RADIANS(lat1)) * COS(RADIANS(lat2)) *
       SIN(dLng/2) * SIN(dLng/2);
  c := 2 * ATAN2(SQRT(a), SQRT(1-a));

  RETURN R * c;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

COMMENT ON FUNCTION calculate_distance_miles IS 'Haversine formula for distance between two lat/lng points in miles';

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE user_marketplace_settings IS 'User marketplace preferences, shipping location, and Stripe Connect info';
COMMENT ON TABLE marketplace_listings IS 'Board game marketplace listings for buy/sell/trade';
COMMENT ON TABLE listing_images IS 'Photos for marketplace listings';
COMMENT ON TABLE listing_saves IS 'User watchlist/favorites for listings';

COMMENT ON COLUMN marketplace_listings.price_cents IS 'Price in cents to avoid floating point issues';
COMMENT ON COLUMN marketplace_listings.fts IS 'Full-text search vector for listing content';
COMMENT ON COLUMN marketplace_listings.trade_game_ids IS 'Array of game IDs the seller wants in trade';
