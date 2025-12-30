-- Migration: Marketplace Transactions
-- Payment processing and fulfillment tracking for marketplace sales

-- ============================================
-- ENUMS
-- ============================================

-- Transaction lifecycle status
CREATE TYPE transaction_status AS ENUM (
  'pending_payment',      -- Awaiting buyer payment
  'payment_processing',   -- Payment being processed
  'payment_held',         -- Payment secured in escrow
  'shipped',              -- Item shipped by seller
  'delivered',            -- Item marked as delivered
  'completed',            -- Transaction complete, funds released
  'refund_requested',     -- Buyer requested refund
  'refunded',             -- Payment refunded
  'disputed',             -- Under dispute resolution
  'cancelled'             -- Transaction cancelled
);

-- Shipping carrier for tracking
CREATE TYPE shipping_carrier AS ENUM (
  'usps',
  'ups',
  'fedex',
  'dhl',
  'other'
);

-- ============================================
-- MARKETPLACE TRANSACTIONS
-- ============================================

CREATE TABLE marketplace_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  offer_id UUID NOT NULL REFERENCES marketplace_offers(id) ON DELETE RESTRICT,
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE RESTRICT,

  -- Stripe payment details
  stripe_payment_intent_id VARCHAR(100),
  stripe_charge_id VARCHAR(100),
  stripe_transfer_id VARCHAR(100),
  stripe_checkout_session_id VARCHAR(100),

  -- Amounts (all in cents)
  amount_cents INTEGER NOT NULL CHECK (amount_cents > 0),
  shipping_cents INTEGER DEFAULT 0 CHECK (shipping_cents >= 0),
  platform_fee_cents INTEGER NOT NULL CHECK (platform_fee_cents >= 0),
  stripe_fee_cents INTEGER NOT NULL CHECK (stripe_fee_cents >= 0),
  seller_payout_cents INTEGER NOT NULL CHECK (seller_payout_cents >= 0),
  currency VARCHAR(3) DEFAULT 'USD',

  -- Status
  status transaction_status NOT NULL DEFAULT 'pending_payment',

  -- Shipping details
  shipping_carrier shipping_carrier,
  tracking_number VARCHAR(200),
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,

  -- Timestamps
  paid_at TIMESTAMPTZ,
  released_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Constraints
  CONSTRAINT buyer_not_seller CHECK (buyer_id != seller_id),
  CONSTRAINT one_transaction_per_offer UNIQUE (offer_id)
);

-- ============================================
-- INDEXES
-- ============================================

-- User queries
CREATE INDEX idx_transactions_buyer ON marketplace_transactions(buyer_id, status, created_at DESC);
CREATE INDEX idx_transactions_seller ON marketplace_transactions(seller_id, status, created_at DESC);

-- Reference lookups
CREATE INDEX idx_transactions_offer ON marketplace_transactions(offer_id);
CREATE INDEX idx_transactions_listing ON marketplace_transactions(listing_id);

-- Stripe webhooks
CREATE INDEX idx_transactions_payment_intent ON marketplace_transactions(stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL;
CREATE INDEX idx_transactions_checkout_session ON marketplace_transactions(stripe_checkout_session_id)
  WHERE stripe_checkout_session_id IS NOT NULL;

-- Status-based queries
CREATE INDEX idx_transactions_status ON marketplace_transactions(status);
CREATE INDEX idx_transactions_pending ON marketplace_transactions(created_at)
  WHERE status = 'pending_payment';
CREATE INDEX idx_transactions_held ON marketplace_transactions(paid_at)
  WHERE status = 'payment_held';

-- Trigger for updated_at
CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON marketplace_transactions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

ALTER TABLE marketplace_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view transactions they're part of
CREATE POLICY "Users can view own transactions"
  ON marketplace_transactions FOR SELECT
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- Only system can insert transactions (via API)
-- This prevents direct inserts; transactions are created through API after offer acceptance
CREATE POLICY "System can insert transactions"
  ON marketplace_transactions FOR INSERT
  WITH CHECK (
    -- Verify the offer is accepted and belongs to the correct buyer/seller
    EXISTS (
      SELECT 1 FROM marketplace_offers o
      WHERE o.id = offer_id
        AND o.status = 'accepted'
        AND o.buyer_id = buyer_id
        AND o.seller_id = seller_id
    )
  );

-- Only involved users can update (specific field updates controlled at API level)
CREATE POLICY "Users can update own transactions"
  ON marketplace_transactions FOR UPDATE
  USING (auth.uid() = buyer_id OR auth.uid() = seller_id);

-- No deletes allowed
-- Transactions are permanent records

-- ============================================
-- NOTIFICATION TRIGGERS
-- ============================================

-- Create notification on transaction status change
CREATE OR REPLACE FUNCTION create_transaction_notification()
RETURNS TRIGGER AS $$
DECLARE
  v_game_name TEXT;
  v_buyer_name TEXT;
  v_seller_name TEXT;
  v_recipient_id UUID;
  v_notification_type notification_type;
  v_message TEXT;
BEGIN
  -- Only trigger on status changes
  IF TG_OP = 'UPDATE' AND OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;

  -- Get game name
  SELECT g.name INTO v_game_name
  FROM marketplace_listings l
  JOIN games g ON g.id = l.game_id
  WHERE l.id = NEW.listing_id;

  -- Get user names
  SELECT COALESCE(display_name, username, 'The buyer') INTO v_buyer_name
  FROM user_profiles WHERE id = NEW.buyer_id;

  SELECT COALESCE(display_name, username, 'The seller') INTO v_seller_name
  FROM user_profiles WHERE id = NEW.seller_id;

  -- Determine notification based on status
  CASE NEW.status
    WHEN 'payment_held' THEN
      -- Notify both parties that payment is secured
      v_notification_type := 'payment_received';

      -- Notify seller
      INSERT INTO user_notifications (user_id, notification_type, from_user_id, message, metadata)
      VALUES (
        NEW.seller_id,
        v_notification_type,
        NEW.buyer_id,
        'Payment received for ' || v_game_name || '. Please ship the item.',
        jsonb_build_object('transaction_id', NEW.id, 'listing_id', NEW.listing_id)
      );

      -- Notify buyer
      INSERT INTO user_notifications (user_id, notification_type, from_user_id, message, metadata)
      VALUES (
        NEW.buyer_id,
        v_notification_type,
        NEW.seller_id,
        'Your payment for ' || v_game_name || ' is secured. Waiting for seller to ship.',
        jsonb_build_object('transaction_id', NEW.id, 'listing_id', NEW.listing_id)
      );

    WHEN 'shipped' THEN
      -- Notify buyer that item shipped
      v_notification_type := 'transaction_shipped';
      v_recipient_id := NEW.buyer_id;
      v_message := v_seller_name || ' shipped ' || v_game_name;

      IF NEW.tracking_number IS NOT NULL THEN
        v_message := v_message || '. Tracking: ' || NEW.tracking_number;
      END IF;

      INSERT INTO user_notifications (user_id, notification_type, from_user_id, message, metadata)
      VALUES (
        v_recipient_id,
        v_notification_type,
        NEW.seller_id,
        v_message,
        jsonb_build_object(
          'transaction_id', NEW.id,
          'listing_id', NEW.listing_id,
          'tracking_number', NEW.tracking_number,
          'shipping_carrier', NEW.shipping_carrier
        )
      );

    WHEN 'delivered' THEN
      -- Notify seller that buyer confirmed delivery
      v_notification_type := 'transaction_delivered';
      INSERT INTO user_notifications (user_id, notification_type, from_user_id, message, metadata)
      VALUES (
        NEW.seller_id,
        v_notification_type,
        NEW.buyer_id,
        v_buyer_name || ' confirmed receipt of ' || v_game_name,
        jsonb_build_object('transaction_id', NEW.id, 'listing_id', NEW.listing_id)
      );

    WHEN 'completed' THEN
      -- Notify seller that funds have been released
      INSERT INTO user_notifications (user_id, notification_type, from_user_id, message, metadata)
      VALUES (
        NEW.seller_id,
        'payment_received',
        NULL,
        'Payment released for ' || v_game_name || '. Funds will be transferred to your account.',
        jsonb_build_object('transaction_id', NEW.id, 'listing_id', NEW.listing_id, 'amount_cents', NEW.seller_payout_cents)
      );

    WHEN 'refund_requested' THEN
      -- Notify seller of refund request
      INSERT INTO user_notifications (user_id, notification_type, from_user_id, message, metadata)
      VALUES (
        NEW.seller_id,
        'new_message',  -- Use generic notification type
        NEW.buyer_id,
        v_buyer_name || ' requested a refund for ' || v_game_name,
        jsonb_build_object('transaction_id', NEW.id, 'listing_id', NEW.listing_id, 'type', 'refund_request')
      );

    WHEN 'refunded' THEN
      -- Notify buyer of successful refund
      INSERT INTO user_notifications (user_id, notification_type, from_user_id, message, metadata)
      VALUES (
        NEW.buyer_id,
        'payment_received',
        NULL,
        'Your refund for ' || v_game_name || ' has been processed.',
        jsonb_build_object('transaction_id', NEW.id, 'listing_id', NEW.listing_id)
      );

    ELSE
      -- No notification for other statuses
      NULL;
  END CASE;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_status_change
  AFTER INSERT OR UPDATE ON marketplace_transactions
  FOR EACH ROW
  EXECUTE FUNCTION create_transaction_notification();

-- ============================================
-- UPDATE LISTING STATUS ON TRANSACTION COMPLETE
-- ============================================

CREATE OR REPLACE FUNCTION update_listing_on_transaction_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- Only trigger on status change to completed
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    -- Mark listing as sold
    UPDATE marketplace_listings
    SET
      status = 'sold',
      sold_at = NOW(),
      updated_at = NOW()
    WHERE id = NEW.listing_id;

    -- Update seller stats
    UPDATE user_marketplace_settings
    SET
      total_sales = total_sales + 1,
      updated_at = NOW()
    WHERE user_id = NEW.seller_id;

    -- Update buyer stats
    UPDATE user_marketplace_settings
    SET
      total_purchases = total_purchases + 1,
      updated_at = NOW()
    WHERE user_id = NEW.buyer_id;
  END IF;

  -- Handle refund/cancel - reactivate listing
  IF NEW.status IN ('refunded', 'cancelled') AND OLD.status NOT IN ('refunded', 'cancelled') THEN
    -- Reactivate listing if it was pending
    UPDATE marketplace_listings
    SET
      status = 'active',
      sold_at = NULL,
      updated_at = NOW()
    WHERE id = NEW.listing_id
      AND status = 'pending';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_transaction_complete
  AFTER UPDATE ON marketplace_transactions
  FOR EACH ROW
  EXECUTE FUNCTION update_listing_on_transaction_complete();

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Create a transaction from an accepted offer
CREATE OR REPLACE FUNCTION create_transaction_from_offer(
  p_offer_id UUID,
  p_amount_cents INTEGER,
  p_shipping_cents INTEGER,
  p_platform_fee_cents INTEGER,
  p_stripe_fee_cents INTEGER,
  p_seller_payout_cents INTEGER
)
RETURNS marketplace_transactions AS $$
DECLARE
  v_offer marketplace_offers;
  v_transaction marketplace_transactions;
BEGIN
  -- Get offer
  SELECT * INTO v_offer FROM marketplace_offers WHERE id = p_offer_id;

  IF v_offer IS NULL THEN
    RAISE EXCEPTION 'Offer not found';
  END IF;

  IF v_offer.status != 'accepted' THEN
    RAISE EXCEPTION 'Can only create transactions for accepted offers';
  END IF;

  -- Check if transaction already exists
  IF EXISTS (SELECT 1 FROM marketplace_transactions WHERE offer_id = p_offer_id) THEN
    RAISE EXCEPTION 'Transaction already exists for this offer';
  END IF;

  -- Create transaction
  INSERT INTO marketplace_transactions (
    offer_id,
    listing_id,
    buyer_id,
    seller_id,
    amount_cents,
    shipping_cents,
    platform_fee_cents,
    stripe_fee_cents,
    seller_payout_cents,
    status
  ) VALUES (
    p_offer_id,
    v_offer.listing_id,
    v_offer.buyer_id,
    v_offer.seller_id,
    p_amount_cents,
    p_shipping_cents,
    p_platform_fee_cents,
    p_stripe_fee_cents,
    p_seller_payout_cents,
    'pending_payment'
  )
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Mark transaction as paid (called after Stripe webhook confirms payment)
CREATE OR REPLACE FUNCTION mark_transaction_paid(
  p_transaction_id UUID,
  p_payment_intent_id VARCHAR(100),
  p_charge_id VARCHAR(100) DEFAULT NULL
)
RETURNS marketplace_transactions AS $$
DECLARE
  v_transaction marketplace_transactions;
BEGIN
  UPDATE marketplace_transactions
  SET
    status = 'payment_held',
    stripe_payment_intent_id = p_payment_intent_id,
    stripe_charge_id = p_charge_id,
    paid_at = NOW(),
    updated_at = NOW()
  WHERE id = p_transaction_id
    AND status IN ('pending_payment', 'payment_processing')
  RETURNING * INTO v_transaction;

  IF v_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or not in valid state for payment';
  END IF;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add shipping info and mark as shipped (seller action)
CREATE OR REPLACE FUNCTION ship_transaction(
  p_transaction_id UUID,
  p_user_id UUID,
  p_carrier shipping_carrier,
  p_tracking_number VARCHAR(200) DEFAULT NULL
)
RETURNS marketplace_transactions AS $$
DECLARE
  v_transaction marketplace_transactions;
BEGIN
  -- Verify user is seller and transaction is in correct state
  SELECT * INTO v_transaction
  FROM marketplace_transactions
  WHERE id = p_transaction_id
    AND seller_id = p_user_id
    AND status = 'payment_held';

  IF v_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found, not owned by user, or not ready for shipping';
  END IF;

  -- Update transaction
  UPDATE marketplace_transactions
  SET
    status = 'shipped',
    shipping_carrier = p_carrier,
    tracking_number = p_tracking_number,
    shipped_at = NOW(),
    updated_at = NOW()
  WHERE id = p_transaction_id
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Confirm delivery (buyer action)
CREATE OR REPLACE FUNCTION confirm_delivery(
  p_transaction_id UUID,
  p_user_id UUID
)
RETURNS marketplace_transactions AS $$
DECLARE
  v_transaction marketplace_transactions;
BEGIN
  -- Verify user is buyer and transaction is shipped
  SELECT * INTO v_transaction
  FROM marketplace_transactions
  WHERE id = p_transaction_id
    AND buyer_id = p_user_id
    AND status = 'shipped';

  IF v_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found, not owned by user, or not in shipped state';
  END IF;

  -- Update transaction
  UPDATE marketplace_transactions
  SET
    status = 'delivered',
    delivered_at = NOW(),
    updated_at = NOW()
  WHERE id = p_transaction_id
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Release funds (marks transaction complete)
-- Should be called after transfer is confirmed
CREATE OR REPLACE FUNCTION release_transaction_funds(
  p_transaction_id UUID,
  p_transfer_id VARCHAR(100) DEFAULT NULL
)
RETURNS marketplace_transactions AS $$
DECLARE
  v_transaction marketplace_transactions;
BEGIN
  UPDATE marketplace_transactions
  SET
    status = 'completed',
    stripe_transfer_id = COALESCE(p_transfer_id, stripe_transfer_id),
    released_at = NOW(),
    updated_at = NOW()
  WHERE id = p_transaction_id
    AND status IN ('delivered', 'shipped')  -- Can release after delivery or shipped (auto-release)
  RETURNING * INTO v_transaction;

  IF v_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found or not in valid state for release';
  END IF;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Request refund (buyer action)
CREATE OR REPLACE FUNCTION request_refund(
  p_transaction_id UUID,
  p_user_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS marketplace_transactions AS $$
DECLARE
  v_transaction marketplace_transactions;
BEGIN
  -- Verify user is buyer and transaction is in refundable state
  SELECT * INTO v_transaction
  FROM marketplace_transactions
  WHERE id = p_transaction_id
    AND buyer_id = p_user_id
    AND status IN ('payment_held', 'shipped');  -- Can't refund after delivery confirmed

  IF v_transaction IS NULL THEN
    RAISE EXCEPTION 'Transaction not found, not owned by user, or not in refundable state';
  END IF;

  -- Update transaction
  UPDATE marketplace_transactions
  SET
    status = 'refund_requested',
    updated_at = NOW()
  WHERE id = p_transaction_id
  RETURNING * INTO v_transaction;

  RETURN v_transaction;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get transaction statistics for a user
CREATE OR REPLACE FUNCTION get_user_transaction_stats(p_user_id UUID)
RETURNS TABLE (
  as_buyer_pending BIGINT,
  as_buyer_active BIGINT,
  as_buyer_completed BIGINT,
  as_seller_pending BIGINT,
  as_seller_active BIGINT,
  as_seller_completed BIGINT,
  total_spent_cents BIGINT,
  total_earned_cents BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    -- Buyer stats
    COUNT(*) FILTER (WHERE buyer_id = p_user_id AND status = 'pending_payment')::BIGINT as as_buyer_pending,
    COUNT(*) FILTER (WHERE buyer_id = p_user_id AND status IN ('payment_held', 'shipped', 'delivered'))::BIGINT as as_buyer_active,
    COUNT(*) FILTER (WHERE buyer_id = p_user_id AND status = 'completed')::BIGINT as as_buyer_completed,
    -- Seller stats
    COUNT(*) FILTER (WHERE seller_id = p_user_id AND status = 'pending_payment')::BIGINT as as_seller_pending,
    COUNT(*) FILTER (WHERE seller_id = p_user_id AND status IN ('payment_held', 'shipped', 'delivered'))::BIGINT as as_seller_active,
    COUNT(*) FILTER (WHERE seller_id = p_user_id AND status = 'completed')::BIGINT as as_seller_completed,
    -- Totals
    COALESCE(SUM(amount_cents + shipping_cents) FILTER (WHERE buyer_id = p_user_id AND status = 'completed'), 0)::BIGINT as total_spent_cents,
    COALESCE(SUM(seller_payout_cents) FILTER (WHERE seller_id = p_user_id AND status = 'completed'), 0)::BIGINT as total_earned_cents
  FROM marketplace_transactions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- AUTO-RELEASE FUNDS (for scheduled job)
-- ============================================

-- Auto-release funds for delivered transactions after 7 days
CREATE OR REPLACE FUNCTION auto_release_funds()
RETURNS INTEGER AS $$
DECLARE
  v_released_count INTEGER;
BEGIN
  WITH released AS (
    UPDATE marketplace_transactions
    SET
      status = 'completed',
      released_at = NOW(),
      updated_at = NOW()
    WHERE status = 'delivered'
      AND delivered_at < NOW() - INTERVAL '7 days'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_released_count FROM released;

  RETURN v_released_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-cancel unpaid transactions after 24 hours
CREATE OR REPLACE FUNCTION cancel_unpaid_transactions()
RETURNS INTEGER AS $$
DECLARE
  v_cancelled_count INTEGER;
BEGIN
  WITH cancelled AS (
    UPDATE marketplace_transactions
    SET
      status = 'cancelled',
      updated_at = NOW()
    WHERE status = 'pending_payment'
      AND created_at < NOW() - INTERVAL '24 hours'
    RETURNING id
  )
  SELECT COUNT(*) INTO v_cancelled_count FROM cancelled;

  RETURN v_cancelled_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE marketplace_transactions IS 'Marketplace transactions linking offers to payments and fulfillment';
COMMENT ON TYPE transaction_status IS 'Transaction state machine from pending payment through completion';
COMMENT ON TYPE shipping_carrier IS 'Supported shipping carriers for tracking';

COMMENT ON FUNCTION create_transaction_from_offer IS 'Create a transaction record after offer is accepted';
COMMENT ON FUNCTION mark_transaction_paid IS 'Update transaction after payment confirmed (Stripe webhook)';
COMMENT ON FUNCTION ship_transaction IS 'Add tracking and mark transaction as shipped (seller action)';
COMMENT ON FUNCTION confirm_delivery IS 'Buyer confirms item received';
COMMENT ON FUNCTION release_transaction_funds IS 'Complete transaction and release funds to seller';
COMMENT ON FUNCTION request_refund IS 'Buyer requests refund before delivery confirmation';
COMMENT ON FUNCTION auto_release_funds IS 'Auto-release funds 7 days after delivery (scheduled job)';
COMMENT ON FUNCTION cancel_unpaid_transactions IS 'Cancel transactions unpaid after 24 hours (scheduled job)';
