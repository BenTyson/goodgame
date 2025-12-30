-- Migration: Marketplace Offers & Negotiation
-- Structured offer system for price negotiation and trades

-- ============================================
-- ENUMS
-- ============================================

CREATE TYPE offer_type AS ENUM ('buy', 'trade', 'buy_plus_trade');
CREATE TYPE offer_status AS ENUM ('pending', 'accepted', 'declined', 'countered', 'expired', 'withdrawn');

-- ============================================
-- MARKETPLACE OFFERS
-- ============================================

CREATE TABLE marketplace_offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES marketplace_conversations(id) ON DELETE SET NULL,

  -- Offer details
  offer_type offer_type NOT NULL DEFAULT 'buy',

  -- Money offer (for buy and buy_plus_trade)
  amount_cents INTEGER,
  currency VARCHAR(3) DEFAULT 'USD',

  -- Trade offer (for trade and buy_plus_trade)
  -- Array of game IDs from buyer's shelf being offered in trade
  trade_game_ids UUID[] DEFAULT '{}',
  trade_notes TEXT,

  -- Counter-offer chain
  parent_offer_id UUID REFERENCES marketplace_offers(id) ON DELETE SET NULL,
  counter_count INTEGER DEFAULT 0,

  -- Status
  status offer_status NOT NULL DEFAULT 'pending',

  -- Optional message with offer
  message TEXT,

  -- Response (for declined/countered)
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  responded_by UUID REFERENCES user_profiles(id) ON DELETE SET NULL,

  -- Expiration (default 48 hours from creation)
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '48 hours'),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT valid_buy_offer CHECK (
    offer_type = 'trade' OR amount_cents IS NOT NULL
  ),
  CONSTRAINT valid_trade_offer CHECK (
    offer_type = 'buy' OR (trade_game_ids IS NOT NULL AND array_length(trade_game_ids, 1) > 0)
  ),
  CONSTRAINT positive_amount CHECK (
    amount_cents IS NULL OR amount_cents > 0
  ),
  CONSTRAINT buyer_not_seller CHECK (buyer_id != seller_id)
);

-- Indexes
CREATE INDEX idx_offers_listing ON marketplace_offers(listing_id, status, created_at DESC);
CREATE INDEX idx_offers_buyer ON marketplace_offers(buyer_id, status, created_at DESC);
CREATE INDEX idx_offers_seller ON marketplace_offers(seller_id, status, created_at DESC);
CREATE INDEX idx_offers_conversation ON marketplace_offers(conversation_id);
CREATE INDEX idx_offers_parent ON marketplace_offers(parent_offer_id);
CREATE INDEX idx_offers_pending_expiring ON marketplace_offers(expires_at) WHERE status = 'pending';

-- Trigger for updated_at
CREATE TRIGGER update_offers_updated_at
  BEFORE UPDATE ON marketplace_offers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE marketplace_offers ENABLE ROW LEVEL SECURITY;

-- Users can view offers they're part of (as buyer or seller)
CREATE POLICY "Users can view own offers"
  ON marketplace_offers FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Users can create offers as buyer on active listings
CREATE POLICY "Users can create offers as buyer"
  ON marketplace_offers FOR INSERT
  WITH CHECK (
    auth.uid() = buyer_id
    AND auth.uid() != seller_id
    AND EXISTS (
      SELECT 1 FROM marketplace_listings l
      WHERE l.id = listing_id
        AND l.status = 'active'
        AND l.accepts_offers = TRUE
    )
  );

-- Users can update offers they're involved in (for status changes)
CREATE POLICY "Users can update own offers"
  ON marketplace_offers FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Only buyers can delete (withdraw) their pending offers
CREATE POLICY "Buyers can delete pending offers"
  ON marketplace_offers FOR DELETE
  USING (auth.uid() = buyer_id AND status = 'pending');

-- ============================================
-- TRIGGERS
-- ============================================

-- Create notification when offer is created
CREATE OR REPLACE FUNCTION create_offer_notification()
RETURNS TRIGGER AS $$
DECLARE
  buyer_name TEXT;
  game_name TEXT;
  offer_amount TEXT;
BEGIN
  -- Get buyer name
  SELECT COALESCE(display_name, username, 'Someone') INTO buyer_name
  FROM user_profiles WHERE id = NEW.buyer_id;

  -- Get game name
  SELECT g.name INTO game_name
  FROM marketplace_listings l
  JOIN games g ON g.id = l.game_id
  WHERE l.id = NEW.listing_id;

  -- Format offer amount
  IF NEW.offer_type = 'trade' THEN
    offer_amount := 'a trade';
  ELSIF NEW.offer_type = 'buy_plus_trade' THEN
    offer_amount := '$' || (NEW.amount_cents / 100.0)::TEXT || ' + trade';
  ELSE
    offer_amount := '$' || (NEW.amount_cents / 100.0)::TEXT;
  END IF;

  -- Notify seller of new offer
  INSERT INTO user_notifications (user_id, notification_type, from_user_id, message, metadata)
  VALUES (
    NEW.seller_id,
    'new_offer',
    NEW.buyer_id,
    buyer_name || ' made ' || offer_amount || ' offer on ' || game_name,
    jsonb_build_object('offer_id', NEW.id, 'listing_id', NEW.listing_id)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_offer
  AFTER INSERT ON marketplace_offers
  FOR EACH ROW
  EXECUTE FUNCTION create_offer_notification();

-- Create notification when offer status changes
CREATE OR REPLACE FUNCTION create_offer_status_notification()
RETURNS TRIGGER AS $$
DECLARE
  responder_name TEXT;
  game_name TEXT;
  recipient_id UUID;
  message_text TEXT;
BEGIN
  -- Only trigger on status changes
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get game name
  SELECT g.name INTO game_name
  FROM marketplace_listings l
  JOIN games g ON g.id = l.game_id
  WHERE l.id = NEW.listing_id;

  -- Determine recipient and message based on status
  CASE NEW.status
    WHEN 'accepted' THEN
      -- Notify buyer that offer was accepted
      SELECT COALESCE(display_name, username, 'The seller') INTO responder_name
      FROM user_profiles WHERE id = NEW.seller_id;
      recipient_id := NEW.buyer_id;
      message_text := responder_name || ' accepted your offer on ' || game_name;

    WHEN 'declined' THEN
      -- Notify buyer that offer was declined
      SELECT COALESCE(display_name, username, 'The seller') INTO responder_name
      FROM user_profiles WHERE id = NEW.seller_id;
      recipient_id := NEW.buyer_id;
      message_text := responder_name || ' declined your offer on ' || game_name;

    WHEN 'countered' THEN
      -- Notify buyer that seller countered
      SELECT COALESCE(display_name, username, 'The seller') INTO responder_name
      FROM user_profiles WHERE id = NEW.seller_id;
      recipient_id := NEW.buyer_id;
      message_text := responder_name || ' made a counter-offer on ' || game_name;

    WHEN 'withdrawn' THEN
      -- Notify seller that buyer withdrew
      SELECT COALESCE(display_name, username, 'The buyer') INTO responder_name
      FROM user_profiles WHERE id = NEW.buyer_id;
      recipient_id := NEW.seller_id;
      message_text := responder_name || ' withdrew their offer on ' || game_name;

    WHEN 'expired' THEN
      -- Notify buyer that their offer expired
      recipient_id := NEW.buyer_id;
      message_text := 'Your offer on ' || game_name || ' has expired';

    ELSE
      RETURN NEW;
  END CASE;

  -- Create notification
  INSERT INTO user_notifications (user_id, notification_type, from_user_id, message, metadata)
  VALUES (
    recipient_id,
    'offer_' || NEW.status::TEXT,
    NEW.responded_by,
    message_text,
    jsonb_build_object('offer_id', NEW.id, 'listing_id', NEW.listing_id, 'status', NEW.status)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_offer_status_change
  AFTER UPDATE ON marketplace_offers
  FOR EACH ROW
  EXECUTE FUNCTION create_offer_status_notification();

-- Update listing status when offer is accepted
CREATE OR REPLACE FUNCTION update_listing_on_offer_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger when status changes to accepted
  IF OLD.status != 'accepted' AND NEW.status = 'accepted' THEN
    -- Mark listing as pending (sale in progress)
    UPDATE marketplace_listings
    SET status = 'pending', updated_at = NOW()
    WHERE id = NEW.listing_id;

    -- Decline all other pending offers on this listing
    UPDATE marketplace_offers
    SET
      status = 'declined',
      response_message = 'Another offer was accepted',
      responded_at = NOW(),
      responded_by = NEW.seller_id,
      updated_at = NOW()
    WHERE listing_id = NEW.listing_id
      AND id != NEW.id
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_offer_accepted
  AFTER UPDATE ON marketplace_offers
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_on_offer_accepted();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Accept an offer (seller action)
CREATE OR REPLACE FUNCTION accept_offer(
  p_offer_id UUID,
  p_user_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS marketplace_offers AS $$
DECLARE
  v_offer marketplace_offers;
BEGIN
  -- Get offer and verify user is seller
  SELECT * INTO v_offer FROM marketplace_offers WHERE id = p_offer_id;

  IF v_offer IS NULL THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.seller_id != p_user_id THEN
    RAISE EXCEPTION 'Only the seller can accept offers';
  END IF;

  IF v_offer.status != 'pending' THEN
    RAISE EXCEPTION 'Can only accept pending offers';
  END IF;

  IF v_offer.expires_at < NOW() THEN
    -- Update to expired first
    UPDATE marketplace_offers SET status = 'expired', updated_at = NOW() WHERE id = p_offer_id;
    RAISE EXCEPTION 'Offer has expired';
  END IF;

  -- Accept the offer
  UPDATE marketplace_offers
  SET
    status = 'accepted',
    response_message = p_message,
    responded_at = NOW(),
    responded_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_offer_id
  RETURNING * INTO v_offer;

  RETURN v_offer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Decline an offer (seller action)
CREATE OR REPLACE FUNCTION decline_offer(
  p_offer_id UUID,
  p_user_id UUID,
  p_message TEXT DEFAULT NULL
)
RETURNS marketplace_offers AS $$
DECLARE
  v_offer marketplace_offers;
BEGIN
  -- Get offer and verify user is seller
  SELECT * INTO v_offer FROM marketplace_offers WHERE id = p_offer_id;

  IF v_offer IS NULL THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.seller_id != p_user_id THEN
    RAISE EXCEPTION 'Only the seller can decline offers';
  END IF;

  IF v_offer.status != 'pending' THEN
    RAISE EXCEPTION 'Can only decline pending offers';
  END IF;

  -- Decline the offer
  UPDATE marketplace_offers
  SET
    status = 'declined',
    response_message = p_message,
    responded_at = NOW(),
    responded_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_offer_id
  RETURNING * INTO v_offer;

  RETURN v_offer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Counter an offer (seller action, creates new offer)
CREATE OR REPLACE FUNCTION counter_offer(
  p_offer_id UUID,
  p_user_id UUID,
  p_amount_cents INTEGER DEFAULT NULL,
  p_trade_game_ids UUID[] DEFAULT NULL,
  p_message TEXT DEFAULT NULL
)
RETURNS marketplace_offers AS $$
DECLARE
  v_original_offer marketplace_offers;
  v_new_offer marketplace_offers;
  v_offer_type offer_type;
BEGIN
  -- Get original offer and verify user is seller
  SELECT * INTO v_original_offer FROM marketplace_offers WHERE id = p_offer_id;

  IF v_original_offer IS NULL THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_original_offer.seller_id != p_user_id THEN
    RAISE EXCEPTION 'Only the seller can counter offers';
  END IF;

  IF v_original_offer.status != 'pending' THEN
    RAISE EXCEPTION 'Can only counter pending offers';
  END IF;

  IF v_original_offer.expires_at < NOW() THEN
    UPDATE marketplace_offers SET status = 'expired', updated_at = NOW() WHERE id = p_offer_id;
    RAISE EXCEPTION 'Offer has expired';
  END IF;

  -- Determine counter-offer type
  IF p_amount_cents IS NOT NULL AND p_trade_game_ids IS NOT NULL AND array_length(p_trade_game_ids, 1) > 0 THEN
    v_offer_type := 'buy_plus_trade';
  ELSIF p_trade_game_ids IS NOT NULL AND array_length(p_trade_game_ids, 1) > 0 THEN
    v_offer_type := 'trade';
  ELSE
    v_offer_type := 'buy';
  END IF;

  -- Mark original offer as countered
  UPDATE marketplace_offers
  SET
    status = 'countered',
    response_message = p_message,
    responded_at = NOW(),
    responded_by = p_user_id,
    updated_at = NOW()
  WHERE id = p_offer_id;

  -- Create counter-offer (roles are swapped: seller becomes "buyer" in the counter)
  INSERT INTO marketplace_offers (
    listing_id,
    buyer_id,
    seller_id,
    conversation_id,
    offer_type,
    amount_cents,
    currency,
    trade_game_ids,
    parent_offer_id,
    counter_count,
    message,
    expires_at
  ) VALUES (
    v_original_offer.listing_id,
    v_original_offer.seller_id,  -- Seller is now the one making the offer
    v_original_offer.buyer_id,   -- Original buyer is now receiving
    v_original_offer.conversation_id,
    v_offer_type,
    p_amount_cents,
    v_original_offer.currency,
    p_trade_game_ids,
    p_offer_id,
    v_original_offer.counter_count + 1,
    p_message,
    NOW() + INTERVAL '48 hours'
  )
  RETURNING * INTO v_new_offer;

  RETURN v_new_offer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Withdraw an offer (buyer action)
CREATE OR REPLACE FUNCTION withdraw_offer(
  p_offer_id UUID,
  p_user_id UUID
)
RETURNS marketplace_offers AS $$
DECLARE
  v_offer marketplace_offers;
BEGIN
  -- Get offer and verify user is buyer
  SELECT * INTO v_offer FROM marketplace_offers WHERE id = p_offer_id;

  IF v_offer IS NULL THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.buyer_id != p_user_id THEN
    RAISE EXCEPTION 'Only the buyer can withdraw offers';
  END IF;

  IF v_offer.status != 'pending' THEN
    RAISE EXCEPTION 'Can only withdraw pending offers';
  END IF;

  -- Withdraw the offer
  UPDATE marketplace_offers
  SET
    status = 'withdrawn',
    updated_at = NOW()
  WHERE id = p_offer_id
  RETURNING * INTO v_offer;

  RETURN v_offer;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expire stale offers (called by cron job)
CREATE OR REPLACE FUNCTION expire_stale_offers()
RETURNS INTEGER AS $$
DECLARE
  v_expired_count INTEGER;
BEGIN
  WITH expired AS (
    UPDATE marketplace_offers
    SET
      status = 'expired',
      updated_at = NOW()
    WHERE status = 'pending'
      AND expires_at < NOW()
    RETURNING id
  )
  SELECT COUNT(*) INTO v_expired_count FROM expired;

  RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get offer counts for a listing
CREATE OR REPLACE FUNCTION get_listing_offer_counts(p_listing_id UUID)
RETURNS TABLE (
  total_offers BIGINT,
  pending_offers BIGINT,
  highest_offer_cents INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_offers,
    COUNT(*) FILTER (WHERE status = 'pending')::BIGINT as pending_offers,
    MAX(amount_cents) FILTER (WHERE status = 'pending') as highest_offer_cents
  FROM marketplace_offers
  WHERE listing_id = p_listing_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- ADD NOTIFICATION TYPES
-- ============================================

-- Add new notification types for offers
DO $$
BEGIN
  -- Check if notification_type is an enum (it might be varchar)
  IF EXISTS (
    SELECT 1 FROM pg_type WHERE typname = 'notification_type'
  ) THEN
    -- Add new enum values if they don't exist
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_offer';
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'offer_accepted';
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'offer_declined';
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'offer_countered';
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'offer_withdrawn';
    ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'offer_expired';
  END IF;
END $$;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE marketplace_offers IS 'Offers and counter-offers on marketplace listings';
COMMENT ON TYPE offer_type IS 'Type of offer: buy (cash), trade (games), or buy_plus_trade (both)';
COMMENT ON TYPE offer_status IS 'Offer state machine: pending -> accepted/declined/countered/expired/withdrawn';
COMMENT ON FUNCTION accept_offer IS 'Accept a pending offer (seller action)';
COMMENT ON FUNCTION decline_offer IS 'Decline a pending offer (seller action)';
COMMENT ON FUNCTION counter_offer IS 'Counter a pending offer with new terms (seller action)';
COMMENT ON FUNCTION withdraw_offer IS 'Withdraw a pending offer (buyer action)';
COMMENT ON FUNCTION expire_stale_offers IS 'Expire all offers past their expiration date (cron job)';
COMMENT ON FUNCTION get_listing_offer_counts IS 'Get offer statistics for a listing';
