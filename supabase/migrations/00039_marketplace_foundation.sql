-- Migration: Marketplace Foundation
-- Feature flags and base infrastructure for the marketplace

-- ============================================
-- FEATURE FLAGS TABLE
-- ============================================
-- Simple feature flag system for gradual rollout

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(100) UNIQUE NOT NULL,
  is_enabled BOOLEAN DEFAULT FALSE,

  -- Beta access control - specific users who can access before public launch
  allowed_user_ids UUID[] DEFAULT '{}',

  -- Additional metadata for flag configuration
  metadata JSONB DEFAULT '{}',

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for quick flag lookups
CREATE INDEX idx_feature_flags_key ON feature_flags(flag_key);

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Public read access (flags are not secret)
CREATE POLICY "Public can read feature flags"
  ON feature_flags FOR SELECT
  USING (true);

-- Only admins can modify flags (enforced at API level)

-- Trigger for updated_at
CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED MARKETPLACE FLAGS
-- ============================================

INSERT INTO feature_flags (flag_key, is_enabled, metadata) VALUES
  ('marketplace_enabled', false, '{"description": "Master switch for marketplace visibility"}'),
  ('marketplace_beta_access', false, '{"description": "Allow specific users early access to marketplace"}');

-- ============================================
-- EXTEND NOTIFICATION TYPES FOR MARKETPLACE
-- ============================================
-- Add new notification types that marketplace will use

ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_offer';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'offer_accepted';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'offer_declined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'offer_countered';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'new_message';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'transaction_shipped';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'transaction_delivered';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'feedback_received';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'wishlist_match';

-- ============================================
-- EXTEND ACTIVITY TYPES FOR MARKETPLACE
-- ============================================

ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'listing_created';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'listing_sold';
ALTER TYPE activity_type ADD VALUE IF NOT EXISTS 'listing_traded';

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE feature_flags IS 'Feature flags for gradual rollout of new features';
COMMENT ON COLUMN feature_flags.flag_key IS 'Unique identifier for the flag (e.g., marketplace_enabled)';
COMMENT ON COLUMN feature_flags.allowed_user_ids IS 'Array of user IDs who can access this feature in beta';
