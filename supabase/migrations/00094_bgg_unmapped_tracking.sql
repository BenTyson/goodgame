-- Track unmapped BGG tags to prioritize mapping additions
-- This helps identify which BGG categories/mechanics are frequently imported but not mapped

CREATE TABLE IF NOT EXISTS bgg_unmapped_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bgg_name TEXT NOT NULL,
  bgg_type TEXT NOT NULL CHECK (bgg_type IN ('category', 'mechanic')),
  occurrence_count INTEGER DEFAULT 1,
  first_seen_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW(),
  -- Optional: track which games had this unmapped tag
  example_bgg_ids INTEGER[] DEFAULT '{}',
  UNIQUE(bgg_name, bgg_type)
);

-- Index for querying most common unmapped tags
CREATE INDEX IF NOT EXISTS idx_bgg_unmapped_tags_count ON bgg_unmapped_tags(occurrence_count DESC);
CREATE INDEX IF NOT EXISTS idx_bgg_unmapped_tags_type ON bgg_unmapped_tags(bgg_type);

-- Function to track/upsert unmapped BGG tags
CREATE OR REPLACE FUNCTION track_unmapped_bgg_tag(
  p_bgg_id INTEGER,
  p_bgg_name TEXT,
  p_bgg_type TEXT
) RETURNS VOID AS $$
BEGIN
  INSERT INTO bgg_unmapped_tags (bgg_name, bgg_type, example_bgg_ids)
  VALUES (p_bgg_name, p_bgg_type, ARRAY[p_bgg_id])
  ON CONFLICT (bgg_name, bgg_type) DO UPDATE
  SET
    occurrence_count = bgg_unmapped_tags.occurrence_count + 1,
    last_seen_at = NOW(),
    example_bgg_ids = (
      SELECT ARRAY(
        SELECT DISTINCT unnest
        FROM unnest(
          ARRAY_CAT(bgg_unmapped_tags.example_bgg_ids, ARRAY[p_bgg_id])
        ) AS unnest
        LIMIT 10
      )
    );
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON TABLE bgg_unmapped_tags IS 'Tracks BGG categories and mechanics that are imported but not mapped to our taxonomy. Use this to prioritize adding new mappings.';
COMMENT ON COLUMN bgg_unmapped_tags.occurrence_count IS 'Number of times this tag has been seen during imports';
COMMENT ON COLUMN bgg_unmapped_tags.example_bgg_ids IS 'Up to 10 example BGG game IDs that had this unmapped tag';
