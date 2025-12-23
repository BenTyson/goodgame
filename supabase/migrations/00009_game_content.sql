-- Migration: 00009_game_content.sql
-- Description: Add content storage columns to games table for database-driven content

-- Content storage (JSONB for flexibility)
ALTER TABLE games ADD COLUMN IF NOT EXISTS rules_content JSONB;
ALTER TABLE games ADD COLUMN IF NOT EXISTS setup_content JSONB;
ALTER TABLE games ADD COLUMN IF NOT EXISTS reference_content JSONB;

-- Content workflow tracking
ALTER TABLE games ADD COLUMN IF NOT EXISTS content_status VARCHAR(20) DEFAULT 'none';
-- Values: none, importing, draft, review, published

ALTER TABLE games ADD COLUMN IF NOT EXISTS content_version INTEGER DEFAULT 1;
ALTER TABLE games ADD COLUMN IF NOT EXISTS content_notes TEXT;
ALTER TABLE games ADD COLUMN IF NOT EXISTS content_generated_at TIMESTAMPTZ;
ALTER TABLE games ADD COLUMN IF NOT EXISTS content_reviewed_at TIMESTAMPTZ;
ALTER TABLE games ADD COLUMN IF NOT EXISTS content_reviewed_by TEXT;

-- BGG sync tracking
ALTER TABLE games ADD COLUMN IF NOT EXISTS bgg_raw_data JSONB;
ALTER TABLE games ADD COLUMN IF NOT EXISTS bgg_last_synced TIMESTAMPTZ;

-- Editorial priority (1=highest, 5=lowest)
ALTER TABLE games ADD COLUMN IF NOT EXISTS priority SMALLINT DEFAULT 3;

-- Index for content workflow queries
CREATE INDEX IF NOT EXISTS idx_games_content_status ON games(content_status);
CREATE INDEX IF NOT EXISTS idx_games_priority ON games(priority);

-- Update existing published games to have 'published' content status
UPDATE games
SET content_status = 'published'
WHERE is_published = true AND content_status = 'none';

COMMENT ON COLUMN games.rules_content IS 'JSONB: quickStart[], overview, setup[], turnStructure[], scoring[], tips[]';
COMMENT ON COLUMN games.setup_content IS 'JSONB: playerSetup[], boardSetup[], componentChecklist[], firstPlayerRule, quickTips[]';
COMMENT ON COLUMN games.reference_content IS 'JSONB: turnSummary[], keyRules[], costs[], quickReminders[], endGame';
COMMENT ON COLUMN games.content_status IS 'Workflow status: none, importing, draft, review, published';
