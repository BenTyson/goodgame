-- Migration: Marketplace Discovery & Alerts (Phase 6)
-- Saved searches, wishlist alerts, and similar listings

-- ============================================
-- ENUMS
-- ============================================

-- Alert frequency for saved searches
CREATE TYPE alert_frequency AS ENUM (
  'instant',     -- Send immediately when match found
  'daily',       -- Daily digest
  'weekly'       -- Weekly digest
);

-- Alert status
CREATE TYPE alert_status AS ENUM (
  'active',      -- Currently monitoring
  'paused',      -- Temporarily disabled
  'expired'      -- Auto-expired (e.g., 90 days of no matches)
);

-- ============================================
-- SAVED SEARCHES TABLE
-- ============================================

CREATE TABLE saved_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Search name/label
  name TEXT NOT NULL,

  -- Search filters (stored as JSONB for flexibility)
  filters JSONB NOT NULL DEFAULT '{}',
  -- Structure:
  -- {
  --   "query": "catan",
  --   "listing_types": ["sell", "trade"],
  --   "conditions": ["new_sealed", "like_new"],
  --   "price_min_cents": 1000,
  --   "price_max_cents": 5000,
  --   "shipping_preferences": ["will_ship"],
  --   "game_ids": ["uuid1", "uuid2"],
  --   "category_ids": ["uuid1"],
  --   "location_postal": "90210",
  --   "max_distance_miles": 50,
  --   "verified_sellers_only": true
  -- }

  -- Alert settings
  alerts_enabled BOOLEAN NOT NULL DEFAULT true,
  alert_frequency alert_frequency NOT NULL DEFAULT 'instant',
  alert_email BOOLEAN NOT NULL DEFAULT true,
  alert_push BOOLEAN NOT NULL DEFAULT false, -- For future mobile app

  -- Status
  status alert_status NOT NULL DEFAULT 'active',

  -- Tracking
  last_match_at TIMESTAMPTZ,
  match_count INTEGER NOT NULL DEFAULT 0,
  last_notified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Limit saved searches per user via trigger (CHECK constraints can't use subqueries)
CREATE OR REPLACE FUNCTION check_saved_search_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM saved_searches WHERE user_id = NEW.user_id) >= 25 THEN
    RAISE EXCEPTION 'Maximum of 25 saved searches allowed per user';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_saved_search_limit
  BEFORE INSERT ON saved_searches
  FOR EACH ROW
  EXECUTE FUNCTION check_saved_search_limit();

-- ============================================
-- SAVED SEARCH INDEXES
-- ============================================

-- User queries
CREATE INDEX idx_saved_searches_user ON saved_searches(user_id, status, created_at DESC);

-- Active alert queries (for cron job)
CREATE INDEX idx_saved_searches_active ON saved_searches(status, alerts_enabled, alert_frequency)
  WHERE status = 'active' AND alerts_enabled = true;

-- Game-specific searches (for new listing matching)
CREATE INDEX idx_saved_searches_game_ids ON saved_searches USING gin ((filters->'game_ids'))
  WHERE filters ? 'game_ids';

-- Trigger for updated_at
CREATE TRIGGER update_saved_searches_updated_at
  BEFORE UPDATE ON saved_searches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- WISHLIST ALERTS TABLE
-- ============================================

-- Link to user_games shelf (wishlist items)
CREATE TABLE wishlist_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

  -- Alert settings
  alerts_enabled BOOLEAN NOT NULL DEFAULT true,

  -- Price threshold (alert when listing is at or below this price)
  max_price_cents INTEGER,

  -- Condition preferences (only alert for these conditions)
  accepted_conditions game_condition[] DEFAULT ARRAY['new_sealed', 'like_new', 'very_good']::game_condition[],

  -- Shipping preference
  local_only BOOLEAN NOT NULL DEFAULT false,
  max_distance_miles INTEGER,

  -- Status
  status alert_status NOT NULL DEFAULT 'active',

  -- Tracking
  last_match_at TIMESTAMPTZ,
  match_count INTEGER NOT NULL DEFAULT 0,
  last_notified_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One alert per game per user
  CONSTRAINT unique_wishlist_alert UNIQUE (user_id, game_id)
);

-- ============================================
-- WISHLIST ALERTS INDEXES
-- ============================================

-- User queries
CREATE INDEX idx_wishlist_alerts_user ON wishlist_alerts(user_id, status, created_at DESC);

-- Game queries (for new listing matching)
CREATE INDEX idx_wishlist_alerts_game ON wishlist_alerts(game_id, status)
  WHERE status = 'active' AND alerts_enabled = true;

-- Active alerts for cron
CREATE INDEX idx_wishlist_alerts_active ON wishlist_alerts(status, alerts_enabled)
  WHERE status = 'active' AND alerts_enabled = true;

-- Trigger for updated_at
CREATE TRIGGER update_wishlist_alerts_updated_at
  BEFORE UPDATE ON wishlist_alerts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ALERT NOTIFICATIONS TABLE
-- ============================================

-- Track which listings have been sent as alerts
CREATE TABLE alert_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Reference to source (one of these will be set)
  saved_search_id UUID REFERENCES saved_searches(id) ON DELETE CASCADE,
  wishlist_alert_id UUID REFERENCES wishlist_alerts(id) ON DELETE CASCADE,

  -- The listing that matched
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,

  -- The user who was notified
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Notification status
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  email_sent BOOLEAN NOT NULL DEFAULT false,
  push_sent BOOLEAN NOT NULL DEFAULT false,

  -- Must have either saved_search_id or wishlist_alert_id
  CONSTRAINT alert_source_required CHECK (
    (saved_search_id IS NOT NULL AND wishlist_alert_id IS NULL) OR
    (saved_search_id IS NULL AND wishlist_alert_id IS NOT NULL)
  )
);

-- Create unique indexes for preventing duplicate notifications
CREATE UNIQUE INDEX idx_alert_notification_saved_search
  ON alert_notifications(saved_search_id, listing_id)
  WHERE saved_search_id IS NOT NULL;

CREATE UNIQUE INDEX idx_alert_notification_wishlist
  ON alert_notifications(wishlist_alert_id, listing_id)
  WHERE wishlist_alert_id IS NOT NULL;

-- ============================================
-- ALERT NOTIFICATIONS INDEXES
-- ============================================

-- Prevent duplicate sends
CREATE INDEX idx_alert_notifications_listing ON alert_notifications(listing_id, user_id);

-- User history
CREATE INDEX idx_alert_notifications_user ON alert_notifications(user_id, sent_at DESC);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_notifications ENABLE ROW LEVEL SECURITY;

-- Saved Searches: Users can only see/manage their own
CREATE POLICY "Users can view own saved searches"
  ON saved_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create saved searches"
  ON saved_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved searches"
  ON saved_searches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved searches"
  ON saved_searches FOR DELETE
  USING (auth.uid() = user_id);

-- Wishlist Alerts: Users can only see/manage their own
CREATE POLICY "Users can view own wishlist alerts"
  ON wishlist_alerts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create wishlist alerts"
  ON wishlist_alerts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wishlist alerts"
  ON wishlist_alerts FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own wishlist alerts"
  ON wishlist_alerts FOR DELETE
  USING (auth.uid() = user_id);

-- Alert Notifications: Users can only see their own
CREATE POLICY "Users can view own alert notifications"
  ON alert_notifications FOR SELECT
  USING (auth.uid() = user_id);

-- System/cron can insert (via service role)
-- No user insert policy needed

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Create or update a saved search
CREATE OR REPLACE FUNCTION upsert_saved_search(
  p_user_id UUID,
  p_name TEXT,
  p_filters JSONB,
  p_alert_frequency alert_frequency DEFAULT 'instant',
  p_alert_email BOOLEAN DEFAULT true,
  p_id UUID DEFAULT NULL
)
RETURNS saved_searches AS $$
DECLARE
  v_result saved_searches;
  v_count INTEGER;
BEGIN
  -- Check limit (25 per user)
  SELECT COUNT(*) INTO v_count FROM saved_searches WHERE user_id = p_user_id;

  IF p_id IS NULL AND v_count >= 25 THEN
    RAISE EXCEPTION 'Maximum saved searches limit reached (25)';
  END IF;

  IF p_id IS NOT NULL THEN
    -- Update existing
    UPDATE saved_searches
    SET
      name = p_name,
      filters = p_filters,
      alert_frequency = p_alert_frequency,
      alert_email = p_alert_email,
      updated_at = NOW()
    WHERE id = p_id AND user_id = p_user_id
    RETURNING * INTO v_result;

    IF v_result IS NULL THEN
      RAISE EXCEPTION 'Saved search not found or access denied';
    END IF;
  ELSE
    -- Create new
    INSERT INTO saved_searches (user_id, name, filters, alert_frequency, alert_email)
    VALUES (p_user_id, p_name, p_filters, p_alert_frequency, p_alert_email)
    RETURNING * INTO v_result;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create or update a wishlist alert
CREATE OR REPLACE FUNCTION upsert_wishlist_alert(
  p_user_id UUID,
  p_game_id UUID,
  p_max_price_cents INTEGER DEFAULT NULL,
  p_accepted_conditions game_condition[] DEFAULT ARRAY['new_sealed', 'like_new', 'very_good']::game_condition[],
  p_local_only BOOLEAN DEFAULT false,
  p_max_distance_miles INTEGER DEFAULT NULL
)
RETURNS wishlist_alerts AS $$
DECLARE
  v_result wishlist_alerts;
BEGIN
  INSERT INTO wishlist_alerts (
    user_id,
    game_id,
    max_price_cents,
    accepted_conditions,
    local_only,
    max_distance_miles
  )
  VALUES (
    p_user_id,
    p_game_id,
    p_max_price_cents,
    p_accepted_conditions,
    p_local_only,
    p_max_distance_miles
  )
  ON CONFLICT (user_id, game_id) DO UPDATE
  SET
    max_price_cents = EXCLUDED.max_price_cents,
    accepted_conditions = EXCLUDED.accepted_conditions,
    local_only = EXCLUDED.local_only,
    max_distance_miles = EXCLUDED.max_distance_miles,
    alerts_enabled = true,
    status = 'active',
    updated_at = NOW()
  RETURNING * INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find matching saved searches for a new listing
CREATE OR REPLACE FUNCTION find_matching_saved_searches(p_listing_id UUID)
RETURNS TABLE (
  saved_search_id UUID,
  user_id UUID,
  alert_email BOOLEAN,
  alert_push BOOLEAN
) AS $$
DECLARE
  v_listing marketplace_listings;
  v_game games;
BEGIN
  -- Get listing and game info
  SELECT * INTO v_listing FROM marketplace_listings WHERE id = p_listing_id;
  SELECT * INTO v_game FROM games WHERE id = v_listing.game_id;

  IF v_listing IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ss.id as saved_search_id,
    ss.user_id,
    ss.alert_email,
    ss.alert_push
  FROM saved_searches ss
  WHERE ss.status = 'active'
    AND ss.alerts_enabled = true
    AND ss.user_id != v_listing.seller_id  -- Don't alert sellers about their own listings
    -- Check filters
    AND (
      -- Query match (case insensitive)
      NOT ss.filters ? 'query'
      OR v_game.name ILIKE '%' || (ss.filters->>'query') || '%'
    )
    AND (
      -- Listing type match
      NOT ss.filters ? 'listing_types'
      OR v_listing.listing_type = ANY(ARRAY(SELECT jsonb_array_elements_text(ss.filters->'listing_types'))::listing_type[])
    )
    AND (
      -- Condition match
      NOT ss.filters ? 'conditions'
      OR v_listing.condition = ANY(ARRAY(SELECT jsonb_array_elements_text(ss.filters->'conditions'))::game_condition[])
    )
    AND (
      -- Price range match
      (NOT ss.filters ? 'price_min_cents' OR v_listing.price_cents >= (ss.filters->>'price_min_cents')::integer)
      AND (NOT ss.filters ? 'price_max_cents' OR v_listing.price_cents <= (ss.filters->>'price_max_cents')::integer)
    )
    AND (
      -- Game ID match
      NOT ss.filters ? 'game_ids'
      OR v_listing.game_id::text = ANY(ARRAY(SELECT jsonb_array_elements_text(ss.filters->'game_ids')))
    )
    AND (
      -- Shipping preference match
      NOT ss.filters ? 'shipping_preferences'
      OR v_listing.shipping_preference = ANY(ARRAY(SELECT jsonb_array_elements_text(ss.filters->'shipping_preferences'))::shipping_preference[])
    )
    -- No duplicate notifications
    AND NOT EXISTS (
      SELECT 1 FROM alert_notifications an
      WHERE an.saved_search_id = ss.id
        AND an.listing_id = p_listing_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Find matching wishlist alerts for a new listing
CREATE OR REPLACE FUNCTION find_matching_wishlist_alerts(p_listing_id UUID)
RETURNS TABLE (
  wishlist_alert_id UUID,
  user_id UUID
) AS $$
DECLARE
  v_listing marketplace_listings;
BEGIN
  SELECT * INTO v_listing FROM marketplace_listings WHERE id = p_listing_id;

  IF v_listing IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    wa.id as wishlist_alert_id,
    wa.user_id
  FROM wishlist_alerts wa
  WHERE wa.status = 'active'
    AND wa.alerts_enabled = true
    AND wa.game_id = v_listing.game_id
    AND wa.user_id != v_listing.seller_id  -- Don't alert sellers
    -- Price threshold
    AND (wa.max_price_cents IS NULL OR v_listing.price_cents <= wa.max_price_cents)
    -- Condition match
    AND (
      wa.accepted_conditions IS NULL
      OR array_length(wa.accepted_conditions, 1) IS NULL
      OR v_listing.condition = ANY(wa.accepted_conditions)
    )
    -- Local only check
    AND (
      NOT wa.local_only
      OR v_listing.shipping_preference IN ('local_only', 'will_ship')
    )
    -- No duplicate notifications
    AND NOT EXISTS (
      SELECT 1 FROM alert_notifications an
      WHERE an.wishlist_alert_id = wa.id
        AND an.listing_id = p_listing_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Record an alert notification
CREATE OR REPLACE FUNCTION record_alert_notification(
  p_user_id UUID,
  p_listing_id UUID,
  p_saved_search_id UUID DEFAULT NULL,
  p_wishlist_alert_id UUID DEFAULT NULL,
  p_email_sent BOOLEAN DEFAULT false,
  p_push_sent BOOLEAN DEFAULT false
)
RETURNS alert_notifications AS $$
DECLARE
  v_result alert_notifications;
BEGIN
  INSERT INTO alert_notifications (
    user_id,
    listing_id,
    saved_search_id,
    wishlist_alert_id,
    email_sent,
    push_sent
  )
  VALUES (
    p_user_id,
    p_listing_id,
    p_saved_search_id,
    p_wishlist_alert_id,
    p_email_sent,
    p_push_sent
  )
  ON CONFLICT DO NOTHING  -- Ignore duplicates
  RETURNING * INTO v_result;

  -- Update match counts and timestamps
  IF p_saved_search_id IS NOT NULL THEN
    UPDATE saved_searches
    SET
      match_count = match_count + 1,
      last_match_at = NOW(),
      last_notified_at = CASE WHEN p_email_sent OR p_push_sent THEN NOW() ELSE last_notified_at END
    WHERE id = p_saved_search_id;
  END IF;

  IF p_wishlist_alert_id IS NOT NULL THEN
    UPDATE wishlist_alerts
    SET
      match_count = match_count + 1,
      last_match_at = NOW(),
      last_notified_at = CASE WHEN p_email_sent OR p_push_sent THEN NOW() ELSE last_notified_at END
    WHERE id = p_wishlist_alert_id;
  END IF;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's saved searches with match stats
CREATE OR REPLACE FUNCTION get_user_saved_searches(
  p_user_id UUID,
  p_status alert_status DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  name TEXT,
  filters JSONB,
  alerts_enabled BOOLEAN,
  alert_frequency alert_frequency,
  alert_email BOOLEAN,
  status alert_status,
  match_count INTEGER,
  last_match_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ss.id,
    ss.name,
    ss.filters,
    ss.alerts_enabled,
    ss.alert_frequency,
    ss.alert_email,
    ss.status,
    ss.match_count,
    ss.last_match_at,
    ss.created_at,
    ss.updated_at
  FROM saved_searches ss
  WHERE ss.user_id = p_user_id
    AND (p_status IS NULL OR ss.status = p_status)
  ORDER BY ss.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's wishlist alerts with game info
CREATE OR REPLACE FUNCTION get_user_wishlist_alerts(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  game_id UUID,
  game_name TEXT,
  game_slug TEXT,
  game_image TEXT,
  alerts_enabled BOOLEAN,
  max_price_cents INTEGER,
  accepted_conditions game_condition[],
  local_only BOOLEAN,
  max_distance_miles INTEGER,
  status alert_status,
  match_count INTEGER,
  last_match_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    wa.id,
    wa.game_id,
    g.name as game_name,
    g.slug as game_slug,
    COALESCE(g.thumbnail_url, g.box_image_url) as game_image,
    wa.alerts_enabled,
    wa.max_price_cents,
    wa.accepted_conditions,
    wa.local_only,
    wa.max_distance_miles,
    wa.status,
    wa.match_count,
    wa.last_match_at,
    wa.created_at
  FROM wishlist_alerts wa
  JOIN games g ON g.id = wa.game_id
  WHERE wa.user_id = p_user_id
    AND wa.status = 'active'
  ORDER BY wa.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- SIMILAR LISTINGS FUNCTION
-- ============================================

-- Find similar listings to a given listing (for "You might also like" section)
CREATE OR REPLACE FUNCTION get_similar_listings(
  p_listing_id UUID,
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  listing_id UUID,
  similarity_score INTEGER
) AS $$
DECLARE
  v_listing marketplace_listings;
  v_game games;
BEGIN
  -- Get the source listing
  SELECT * INTO v_listing FROM marketplace_listings WHERE id = p_listing_id;
  SELECT * INTO v_game FROM games WHERE id = v_listing.game_id;

  IF v_listing IS NULL THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    ml.id as listing_id,
    -- Calculate similarity score (higher = more similar)
    (
      -- Same game: 100 points
      CASE WHEN ml.game_id = v_listing.game_id THEN 100 ELSE 0 END
      -- Same category (via game): 30 points
      + CASE WHEN EXISTS (
        SELECT 1 FROM game_categories gc1
        JOIN game_categories gc2 ON gc1.category_id = gc2.category_id
        WHERE gc1.game_id = v_game.id AND gc2.game_id = ml.game_id
      ) THEN 30 ELSE 0 END
      -- Similar price range (within 30%): 20 points
      + CASE
        WHEN v_listing.price_cents IS NOT NULL
          AND ml.price_cents IS NOT NULL
          AND ml.price_cents BETWEEN v_listing.price_cents * 0.7 AND v_listing.price_cents * 1.3
        THEN 20 ELSE 0 END
      -- Same condition or better: 15 points
      + CASE
        WHEN ml.condition = v_listing.condition THEN 15
        WHEN ml.condition IN ('new_sealed', 'like_new') AND v_listing.condition IN ('very_good', 'good', 'acceptable') THEN 10
        ELSE 0
      END
      -- Same listing type: 10 points
      + CASE WHEN ml.listing_type = v_listing.listing_type THEN 10 ELSE 0 END
      -- Ships from same region: 10 points
      + CASE WHEN ml.location_state = v_listing.location_state THEN 10 ELSE 0 END
      -- Similar player count game: 10 points
      + CASE
        WHEN v_game.player_count_min IS NOT NULL
          AND EXISTS (
            SELECT 1 FROM games g2
            WHERE g2.id = ml.game_id
              AND g2.player_count_min <= v_game.player_count_max
              AND g2.player_count_max >= v_game.player_count_min
          )
        THEN 10 ELSE 0 END
    )::INTEGER as similarity_score
  FROM marketplace_listings ml
  WHERE ml.id != p_listing_id
    AND ml.status = 'active'
    AND ml.seller_id != v_listing.seller_id  -- Exclude same seller
  ORDER BY 2 DESC, ml.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- TRIGGER: AUTO-CREATE WISHLIST ALERT
-- ============================================

-- When a user adds a game to wishlist, optionally create an alert
-- (The actual alert creation will be handled by the API for user control)

-- ============================================
-- TRIGGER: NOTIFY ON NEW MATCHING LISTING
-- ============================================

-- Create in-app notification when a listing matches alerts
CREATE OR REPLACE FUNCTION notify_matching_alerts()
RETURNS TRIGGER AS $$
DECLARE
  v_game games;
  v_saved_search RECORD;
  v_wishlist_alert RECORD;
BEGIN
  -- Only process newly published listings
  IF NEW.status != 'active' OR NEW.published_at IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get game info
  SELECT * INTO v_game FROM games WHERE id = NEW.game_id;

  -- Process matching saved searches
  FOR v_saved_search IN
    SELECT * FROM find_matching_saved_searches(NEW.id)
  LOOP
    -- Create in-app notification
    INSERT INTO user_notifications (user_id, notification_type, message, metadata)
    VALUES (
      v_saved_search.user_id,
      'listing_match',
      'New listing matches your saved search: ' || v_game.name,
      jsonb_build_object(
        'listing_id', NEW.id,
        'saved_search_id', v_saved_search.saved_search_id,
        'game_name', v_game.name,
        'price_cents', NEW.price_cents
      )
    );

    -- Record the notification (for tracking/deduplication)
    PERFORM record_alert_notification(
      v_saved_search.user_id,
      NEW.id,
      v_saved_search.saved_search_id,
      NULL,
      false,  -- Email sent via separate job
      false
    );
  END LOOP;

  -- Process matching wishlist alerts
  FOR v_wishlist_alert IN
    SELECT * FROM find_matching_wishlist_alerts(NEW.id)
  LOOP
    INSERT INTO user_notifications (user_id, notification_type, message, metadata)
    VALUES (
      v_wishlist_alert.user_id,
      'wishlist_listing',
      'A game on your wishlist is now available: ' || v_game.name,
      jsonb_build_object(
        'listing_id', NEW.id,
        'wishlist_alert_id', v_wishlist_alert.wishlist_alert_id,
        'game_name', v_game.name,
        'price_cents', NEW.price_cents
      )
    );

    PERFORM record_alert_notification(
      v_wishlist_alert.user_id,
      NEW.id,
      NULL,
      v_wishlist_alert.wishlist_alert_id,
      false,
      false
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_listing_published
  AFTER INSERT OR UPDATE OF status, published_at ON marketplace_listings
  FOR EACH ROW
  WHEN (NEW.status = 'active' AND NEW.published_at IS NOT NULL)
  EXECUTE FUNCTION notify_matching_alerts();

-- ============================================
-- ADD NOTIFICATION TYPES
-- ============================================

-- Add new notification types (if not exists via enum extension)
-- Note: In PostgreSQL, we need to add enum values
DO $$
BEGIN
  -- Add listing_match if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'listing_match'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'listing_match';
  END IF;

  -- Add wishlist_listing if not exists
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'wishlist_listing'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'notification_type')
  ) THEN
    ALTER TYPE notification_type ADD VALUE 'wishlist_listing';
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE saved_searches IS 'User saved search filters with alert preferences';
COMMENT ON TABLE wishlist_alerts IS 'Price/availability alerts for games on user wishlist';
COMMENT ON TABLE alert_notifications IS 'Tracking table for sent alert notifications';

COMMENT ON TYPE alert_frequency IS 'How often to send alert digests';
COMMENT ON TYPE alert_status IS 'Current state of an alert subscription';

COMMENT ON FUNCTION upsert_saved_search IS 'Create or update a saved search';
COMMENT ON FUNCTION upsert_wishlist_alert IS 'Create or update a wishlist alert';
COMMENT ON FUNCTION find_matching_saved_searches IS 'Find saved searches that match a new listing';
COMMENT ON FUNCTION find_matching_wishlist_alerts IS 'Find wishlist alerts that match a new listing';
COMMENT ON FUNCTION get_similar_listings IS 'Find similar listings for recommendations';
COMMENT ON FUNCTION notify_matching_alerts IS 'Trigger function to notify users of matching listings';
