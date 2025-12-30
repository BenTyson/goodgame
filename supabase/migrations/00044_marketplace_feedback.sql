-- Migration: Marketplace Feedback & Reputation
-- Rating and feedback system for marketplace transactions

-- ============================================
-- ENUMS
-- ============================================

-- Feedback role (who is leaving the feedback)
CREATE TYPE feedback_role AS ENUM (
  'buyer',   -- Buyer rating the seller
  'seller'   -- Seller rating the buyer
);

-- Trust level (calculated based on reputation)
CREATE TYPE trust_level AS ENUM (
  'new',         -- No completed transactions
  'established', -- 1-4 completed transactions
  'trusted',     -- 5-19 completed transactions with 4.0+ rating
  'top_seller'   -- 20+ completed transactions with 4.5+ rating
);

-- ============================================
-- MARKETPLACE FEEDBACK TABLE
-- ============================================

CREATE TABLE marketplace_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  transaction_id UUID NOT NULL REFERENCES marketplace_transactions(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  reviewee_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,

  -- Feedback details
  role feedback_role NOT NULL,  -- buyer = buyer rating seller, seller = seller rating buyer
  rating SMALLINT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,

  -- Flags
  is_positive BOOLEAN GENERATED ALWAYS AS (rating >= 4) STORED,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Each user can only leave one feedback per transaction
  CONSTRAINT unique_feedback_per_transaction UNIQUE (transaction_id, reviewer_id),
  -- Reviewer cannot review themselves
  CONSTRAINT reviewer_not_reviewee CHECK (reviewer_id != reviewee_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- User queries (for profile display)
CREATE INDEX idx_feedback_reviewee ON marketplace_feedback(reviewee_id, created_at DESC);
CREATE INDEX idx_feedback_reviewer ON marketplace_feedback(reviewer_id, created_at DESC);

-- Transaction lookup
CREATE INDEX idx_feedback_transaction ON marketplace_feedback(transaction_id);

-- Rating queries
CREATE INDEX idx_feedback_rating ON marketplace_feedback(reviewee_id, rating);

-- Role-based queries (seller vs buyer feedback)
CREATE INDEX idx_feedback_role ON marketplace_feedback(reviewee_id, role, rating);

-- Trigger for updated_at
CREATE TRIGGER update_feedback_updated_at
  BEFORE UPDATE ON marketplace_feedback
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE marketplace_feedback ENABLE ROW LEVEL SECURITY;

-- Anyone can view feedback (public reputation)
CREATE POLICY "Feedback is publicly readable"
  ON marketplace_feedback FOR SELECT
  USING (true);

-- Only transaction participants can insert feedback
CREATE POLICY "Transaction participants can insert feedback"
  ON marketplace_feedback FOR INSERT
  WITH CHECK (
    -- User is the reviewer
    auth.uid() = reviewer_id
    -- And is part of the transaction
    AND EXISTS (
      SELECT 1 FROM marketplace_transactions t
      WHERE t.id = transaction_id
        AND (t.buyer_id = auth.uid() OR t.seller_id = auth.uid())
        AND t.status = 'completed'  -- Only completed transactions
    )
    -- And role matches their position
    AND (
      (role = 'buyer' AND EXISTS (
        SELECT 1 FROM marketplace_transactions t
        WHERE t.id = transaction_id AND t.buyer_id = auth.uid()
      ))
      OR
      (role = 'seller' AND EXISTS (
        SELECT 1 FROM marketplace_transactions t
        WHERE t.id = transaction_id AND t.seller_id = auth.uid()
      ))
    )
  );

-- Users can update their own feedback (within time limit via trigger)
CREATE POLICY "Users can update own feedback"
  ON marketplace_feedback FOR UPDATE
  USING (auth.uid() = reviewer_id)
  WITH CHECK (auth.uid() = reviewer_id);

-- No deletes allowed (feedback is permanent)

-- ============================================
-- SELLER REPUTATION VIEW (Materialized)
-- ============================================

-- Create a view for aggregated seller reputation stats
CREATE MATERIALIZED VIEW seller_reputation_stats AS
SELECT
  u.id as user_id,
  -- Overall stats (as seller)
  COUNT(f.id) FILTER (WHERE f.role = 'buyer') as seller_feedback_count,
  ROUND(AVG(f.rating) FILTER (WHERE f.role = 'buyer'), 2) as seller_rating,
  COUNT(f.id) FILTER (WHERE f.role = 'buyer' AND f.rating = 5) as seller_five_star_count,
  COUNT(f.id) FILTER (WHERE f.role = 'buyer' AND f.rating >= 4) as seller_positive_count,
  COUNT(f.id) FILTER (WHERE f.role = 'buyer' AND f.rating <= 2) as seller_negative_count,

  -- Overall stats (as buyer)
  COUNT(f.id) FILTER (WHERE f.role = 'seller') as buyer_feedback_count,
  ROUND(AVG(f.rating) FILTER (WHERE f.role = 'seller'), 2) as buyer_rating,

  -- Combined stats
  COUNT(f.id) as total_feedback_count,
  ROUND(AVG(f.rating), 2) as overall_rating,

  -- Trust level calculation
  CASE
    WHEN COUNT(f.id) FILTER (WHERE f.role = 'buyer') = 0 THEN 'new'::trust_level
    WHEN COUNT(f.id) FILTER (WHERE f.role = 'buyer') < 5 THEN 'established'::trust_level
    WHEN COUNT(f.id) FILTER (WHERE f.role = 'buyer') >= 20
      AND AVG(f.rating) FILTER (WHERE f.role = 'buyer') >= 4.5 THEN 'top_seller'::trust_level
    WHEN COUNT(f.id) FILTER (WHERE f.role = 'buyer') >= 5
      AND AVG(f.rating) FILTER (WHERE f.role = 'buyer') >= 4.0 THEN 'trusted'::trust_level
    ELSE 'established'::trust_level
  END as trust_level,

  -- Sales count from marketplace settings
  COALESCE(ms.total_sales, 0) as total_sales,
  COALESCE(ms.total_purchases, 0) as total_purchases,

  -- Last updated
  NOW() as calculated_at
FROM user_profiles u
LEFT JOIN marketplace_feedback f ON f.reviewee_id = u.id
LEFT JOIN user_marketplace_settings ms ON ms.user_id = u.id
GROUP BY u.id, ms.total_sales, ms.total_purchases;

-- Index on the materialized view
CREATE UNIQUE INDEX idx_seller_reputation_user ON seller_reputation_stats(user_id);
CREATE INDEX idx_seller_reputation_trust ON seller_reputation_stats(trust_level, seller_rating DESC);

-- Function to refresh the materialized view
CREATE OR REPLACE FUNCTION refresh_seller_reputation()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY seller_reputation_stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- NOTIFICATION TRIGGER
-- ============================================

-- Create notification when feedback is received
CREATE OR REPLACE FUNCTION create_feedback_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_reviewer_name TEXT;
  v_game_name TEXT;
  v_rating_text TEXT;
BEGIN
  -- Get reviewer name
  SELECT COALESCE(display_name, username, 'A user') INTO v_reviewer_name
  FROM user_profiles WHERE id = NEW.reviewer_id;

  -- Get game name from the transaction
  SELECT g.name INTO v_game_name
  FROM marketplace_transactions t
  JOIN marketplace_listings l ON l.id = t.listing_id
  JOIN games g ON g.id = l.game_id
  WHERE t.id = NEW.transaction_id;

  -- Create rating text
  v_rating_text := NEW.rating || ' star' || CASE WHEN NEW.rating > 1 THEN 's' ELSE '' END;

  -- Create notification
  INSERT INTO user_notifications (user_id, notification_type, from_user_id, message, metadata)
  VALUES (
    NEW.reviewee_id,
    'feedback_received',
    NEW.reviewer_id,
    v_reviewer_name || ' left you ' || v_rating_text || ' feedback for ' || v_game_name,
    jsonb_build_object(
      'feedback_id', NEW.id,
      'transaction_id', NEW.transaction_id,
      'rating', NEW.rating,
      'role', NEW.role
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_feedback_created
  AFTER INSERT ON marketplace_feedback
  FOR EACH ROW
  EXECUTE FUNCTION create_feedback_notification();

-- ============================================
-- UPDATE MARKETPLACE SETTINGS ON FEEDBACK
-- ============================================

-- Update denormalized rating in marketplace settings
CREATE OR REPLACE FUNCTION update_marketplace_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- Update seller_rating if buyer left feedback (buyer rating seller)
  IF NEW.role = 'buyer' THEN
    UPDATE user_marketplace_settings
    SET
      seller_rating = (
        SELECT ROUND(AVG(rating), 2)
        FROM marketplace_feedback
        WHERE reviewee_id = NEW.reviewee_id AND role = 'buyer'
      ),
      updated_at = NOW()
    WHERE user_id = NEW.reviewee_id;
  END IF;

  -- Update buyer_rating if seller left feedback (seller rating buyer)
  IF NEW.role = 'seller' THEN
    UPDATE user_marketplace_settings
    SET
      buyer_rating = (
        SELECT ROUND(AVG(rating), 2)
        FROM marketplace_feedback
        WHERE reviewee_id = NEW.reviewee_id AND role = 'seller'
      ),
      updated_at = NOW()
    WHERE user_id = NEW.reviewee_id;
  END IF;

  -- Refresh materialized view (async would be better in production)
  -- For now, we'll rely on periodic refresh via cron
  -- PERFORM refresh_seller_reputation();

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_feedback_update_rating
  AFTER INSERT OR UPDATE ON marketplace_feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_marketplace_rating();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Leave feedback for a transaction
CREATE OR REPLACE FUNCTION leave_feedback(
  p_transaction_id UUID,
  p_user_id UUID,
  p_rating SMALLINT,
  p_comment TEXT DEFAULT NULL
)
RETURNS marketplace_feedback AS $$
DECLARE
  v_transaction marketplace_transactions;
  v_role feedback_role;
  v_reviewee_id UUID;
  v_feedback marketplace_feedback;
BEGIN
  -- Get transaction and verify completed status
  SELECT * INTO v_transaction
  FROM marketplace_transactions
  WHERE id = p_transaction_id
    AND status = 'completed';

  IF v_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or not completed';
  END IF;

  -- Determine role and reviewee
  IF v_transaction.buyer_id = p_user_id THEN
    v_role := 'buyer';
    v_reviewee_id := v_transaction.seller_id;
  ELSIF v_transaction.seller_id = p_user_id THEN
    v_role := 'seller';
    v_reviewee_id := v_transaction.buyer_id;
  ELSE
    RAISE EXCEPTION 'User is not part of this transaction';
  END IF;

  -- Check if feedback already exists
  IF EXISTS (
    SELECT 1 FROM marketplace_feedback
    WHERE transaction_id = p_transaction_id AND reviewer_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'Feedback already submitted for this transaction';
  END IF;

  -- Insert feedback
  INSERT INTO marketplace_feedback (
    transaction_id,
    reviewer_id,
    reviewee_id,
    role,
    rating,
    comment
  ) VALUES (
    p_transaction_id,
    p_user_id,
    v_reviewee_id,
    v_role,
    p_rating,
    p_comment
  )
  RETURNING * INTO v_feedback;

  RETURN v_feedback;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get feedback for a user with pagination
CREATE OR REPLACE FUNCTION get_user_feedback(
  p_user_id UUID,
  p_role feedback_role DEFAULT NULL,  -- NULL = all, 'buyer' = as seller, 'seller' = as buyer
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  feedback_id UUID,
  transaction_id UUID,
  reviewer_id UUID,
  reviewer_username TEXT,
  reviewer_display_name TEXT,
  reviewer_avatar TEXT,
  role feedback_role,
  rating SMALLINT,
  comment TEXT,
  game_name TEXT,
  game_slug TEXT,
  game_image TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    f.id as feedback_id,
    f.transaction_id,
    f.reviewer_id,
    u.username as reviewer_username,
    u.display_name as reviewer_display_name,
    COALESCE(u.custom_avatar_url, u.avatar_url) as reviewer_avatar,
    f.role,
    f.rating,
    f.comment,
    g.name as game_name,
    g.slug as game_slug,
    COALESCE(g.thumbnail_url, g.box_image_url) as game_image,
    f.created_at
  FROM marketplace_feedback f
  JOIN user_profiles u ON u.id = f.reviewer_id
  JOIN marketplace_transactions t ON t.id = f.transaction_id
  JOIN marketplace_listings l ON l.id = t.listing_id
  JOIN games g ON g.id = l.game_id
  WHERE f.reviewee_id = p_user_id
    AND (p_role IS NULL OR f.role = p_role)
  ORDER BY f.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get reputation stats for a user (from materialized view or calculate)
CREATE OR REPLACE FUNCTION get_user_reputation(p_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  seller_feedback_count BIGINT,
  seller_rating NUMERIC,
  seller_five_star_count BIGINT,
  seller_positive_count BIGINT,
  seller_negative_count BIGINT,
  buyer_feedback_count BIGINT,
  buyer_rating NUMERIC,
  total_feedback_count BIGINT,
  overall_rating NUMERIC,
  trust_level trust_level,
  total_sales BIGINT,
  total_purchases BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.user_id,
    s.seller_feedback_count,
    s.seller_rating,
    s.seller_five_star_count,
    s.seller_positive_count,
    s.seller_negative_count,
    s.buyer_feedback_count,
    s.buyer_rating,
    s.total_feedback_count,
    s.overall_rating,
    s.trust_level,
    s.total_sales,
    s.total_purchases
  FROM seller_reputation_stats s
  WHERE s.user_id = p_user_id;

  -- If no result (user not in materialized view yet), calculate on the fly
  IF NOT FOUND THEN
    RETURN QUERY
    SELECT
      p_user_id as user_id,
      COUNT(f.id) FILTER (WHERE f.role = 'buyer')::BIGINT as seller_feedback_count,
      ROUND(AVG(f.rating) FILTER (WHERE f.role = 'buyer'), 2) as seller_rating,
      COUNT(f.id) FILTER (WHERE f.role = 'buyer' AND f.rating = 5)::BIGINT as seller_five_star_count,
      COUNT(f.id) FILTER (WHERE f.role = 'buyer' AND f.rating >= 4)::BIGINT as seller_positive_count,
      COUNT(f.id) FILTER (WHERE f.role = 'buyer' AND f.rating <= 2)::BIGINT as seller_negative_count,
      COUNT(f.id) FILTER (WHERE f.role = 'seller')::BIGINT as buyer_feedback_count,
      ROUND(AVG(f.rating) FILTER (WHERE f.role = 'seller'), 2) as buyer_rating,
      COUNT(f.id)::BIGINT as total_feedback_count,
      ROUND(AVG(f.rating), 2) as overall_rating,
      'new'::trust_level as trust_level,
      COALESCE(ms.total_sales, 0)::BIGINT as total_sales,
      COALESCE(ms.total_purchases, 0)::BIGINT as total_purchases
    FROM user_profiles u
    LEFT JOIN marketplace_feedback f ON f.reviewee_id = u.id
    LEFT JOIN user_marketplace_settings ms ON ms.user_id = u.id
    WHERE u.id = p_user_id
    GROUP BY u.id, ms.total_sales, ms.total_purchases;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if a user can leave feedback for a transaction
CREATE OR REPLACE FUNCTION can_leave_feedback(
  p_transaction_id UUID,
  p_user_id UUID
)
RETURNS TABLE (
  can_leave BOOLEAN,
  reason TEXT,
  already_left BOOLEAN,
  role feedback_role
) AS $$
DECLARE
  v_transaction marketplace_transactions;
  v_role feedback_role;
  v_already_left BOOLEAN;
BEGIN
  -- Get transaction
  SELECT * INTO v_transaction
  FROM marketplace_transactions
  WHERE id = p_transaction_id;

  IF v_transaction IS NULL THEN
    RETURN QUERY SELECT false, 'Transaction not found'::TEXT, false, NULL::feedback_role;
    RETURN;
  END IF;

  -- Check if user is part of transaction
  IF v_transaction.buyer_id = p_user_id THEN
    v_role := 'buyer';
  ELSIF v_transaction.seller_id = p_user_id THEN
    v_role := 'seller';
  ELSE
    RETURN QUERY SELECT false, 'Not your transaction'::TEXT, false, NULL::feedback_role;
    RETURN;
  END IF;

  -- Check if transaction is completed
  IF v_transaction.status != 'completed' THEN
    RETURN QUERY SELECT false, 'Transaction not completed'::TEXT, false, v_role;
    RETURN;
  END IF;

  -- Check if already left feedback
  SELECT EXISTS (
    SELECT 1 FROM marketplace_feedback
    WHERE transaction_id = p_transaction_id AND reviewer_id = p_user_id
  ) INTO v_already_left;

  IF v_already_left THEN
    RETURN QUERY SELECT false, 'Already left feedback'::TEXT, true, v_role;
    RETURN;
  END IF;

  -- Can leave feedback
  RETURN QUERY SELECT true, NULL::TEXT, false, v_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE marketplace_feedback IS 'User feedback/ratings for completed marketplace transactions';
COMMENT ON TYPE feedback_role IS 'Who is leaving the feedback - buyer or seller';
COMMENT ON TYPE trust_level IS 'Trust tier based on transaction count and rating';
COMMENT ON MATERIALIZED VIEW seller_reputation_stats IS 'Aggregated reputation statistics for marketplace users';

COMMENT ON FUNCTION leave_feedback IS 'Leave feedback for a completed transaction';
COMMENT ON FUNCTION get_user_feedback IS 'Get paginated feedback for a user';
COMMENT ON FUNCTION get_user_reputation IS 'Get reputation stats from materialized view or calculate';
COMMENT ON FUNCTION can_leave_feedback IS 'Check if user can leave feedback for a transaction';
COMMENT ON FUNCTION refresh_seller_reputation IS 'Refresh the seller reputation materialized view';
