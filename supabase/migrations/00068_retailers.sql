-- =====================================================
-- Retailers Table & Purchase Links Enhancement
-- =====================================================

-- Retailers table - Global retailer definitions
CREATE TABLE IF NOT EXISTS retailers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug varchar(50) UNIQUE NOT NULL,
  name varchar(100) NOT NULL,

  -- Display
  logo_url text,
  brand_color varchar(7),  -- Hex color (e.g., #FF9900)

  -- URL Pattern with placeholders
  -- Supports: {product_id}, {asin}, {affiliate_tag}
  url_pattern text,

  -- Affiliate configuration
  affiliate_tag varchar(100),

  -- Type classification (online, local, marketplace)
  retailer_type varchar(20) DEFAULT 'online'
    CHECK (retailer_type IN ('online', 'local', 'marketplace')),

  -- Display settings
  display_order smallint DEFAULT 0,
  is_active boolean DEFAULT true,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Indexes
CREATE INDEX idx_retailers_slug ON retailers(slug);
CREATE INDEX idx_retailers_active ON retailers(is_active) WHERE is_active = true;
CREATE INDEX idx_retailers_display_order ON retailers(display_order);

-- RLS
ALTER TABLE retailers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active retailers"
  ON retailers FOR SELECT
  USING (is_active = true);

CREATE POLICY "Service role can manage retailers"
  ON retailers FOR ALL
  USING (true)
  WITH CHECK (true);

-- Updated timestamp trigger
CREATE TRIGGER update_retailers_updated_at BEFORE UPDATE ON retailers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- Modify affiliate_links table
-- =====================================================

-- Add retailer_id reference (nullable for backward compatibility)
ALTER TABLE affiliate_links
  ADD COLUMN IF NOT EXISTS retailer_id uuid REFERENCES retailers(id) ON DELETE SET NULL;

-- Add product_id for retailer-specific identifiers
ALTER TABLE affiliate_links
  ADD COLUMN IF NOT EXISTS product_id varchar(100);

-- Index for retailer lookups
CREATE INDEX IF NOT EXISTS idx_affiliate_links_retailer ON affiliate_links(retailer_id);

-- =====================================================
-- Seed common retailers
-- =====================================================

INSERT INTO retailers (slug, name, brand_color, url_pattern, affiliate_tag, retailer_type, display_order) VALUES
  ('amazon', 'Amazon', '#FF9900', 'https://www.amazon.com/dp/{asin}?tag={affiliate_tag}', 'goodgame-20', 'online', 10),
  ('target', 'Target', '#CC0000', 'https://www.target.com/p/{product_id}', NULL, 'online', 20),
  ('walmart', 'Walmart', '#0071CE', 'https://www.walmart.com/ip/{product_id}', NULL, 'online', 25),
  ('miniature-market', 'Miniature Market', '#004B87', 'https://www.miniaturemarket.com/{product_id}.html', NULL, 'online', 30),
  ('coolstuffinc', 'CoolStuffInc', '#0066CC', 'https://www.coolstuffinc.com/p/{product_id}', NULL, 'online', 40),
  ('gamenerdz', 'GameNerdz', '#7B1FA2', 'https://www.gamenerdz.com/{product_id}', NULL, 'online', 50),
  ('noble-knight', 'Noble Knight Games', '#8B4513', 'https://www.nobleknight.com/P/{product_id}', NULL, 'online', 60),
  ('boardlandia', 'Boardlandia', '#2E7D32', 'https://boardlandia.com/products/{product_id}', NULL, 'online', 70),
  ('cardhaus', 'Cardhaus', '#1565C0', 'https://www.cardhaus.com/catalog/{product_id}', NULL, 'online', 80)
ON CONFLICT (slug) DO NOTHING;

-- Comments
COMMENT ON TABLE retailers IS 'Global retailer definitions with URL patterns and affiliate configuration';
COMMENT ON COLUMN retailers.url_pattern IS 'URL template with placeholders: {product_id}, {asin}, {affiliate_tag}';
COMMENT ON COLUMN retailers.retailer_type IS 'online=web retailers, local=FLGS, marketplace=aggregators';
COMMENT ON COLUMN affiliate_links.retailer_id IS 'Reference to retailers table (preferred over legacy provider string)';
COMMENT ON COLUMN affiliate_links.product_id IS 'Product identifier for URL pattern substitution';
