-- Migration: 00012_content_generation_log.sql
-- Description: Log all AI content generation attempts for tracking and debugging

CREATE TABLE IF NOT EXISTS content_generation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID REFERENCES games(id) ON DELETE CASCADE,

  -- What was generated
  content_type VARCHAR(20) NOT NULL, -- 'rules', 'setup', 'reference', 'all'

  -- Generation details
  prompt_version VARCHAR(20), -- Track prompt iterations
  model_used VARCHAR(50), -- 'claude-3-haiku', 'claude-3-sonnet', etc.
  tokens_input INTEGER,
  tokens_output INTEGER,
  generation_time_ms INTEGER,
  cost_usd DECIMAL(10,6), -- Track costs

  -- Result
  status VARCHAR(20) NOT NULL, -- 'success', 'failed', 'partial'
  error_message TEXT,

  -- Store the generated content for reference/debugging
  generated_content JSONB,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for querying logs
CREATE INDEX IF NOT EXISTS idx_content_gen_log_game ON content_generation_log(game_id);
CREATE INDEX IF NOT EXISTS idx_content_gen_log_status ON content_generation_log(status);
CREATE INDEX IF NOT EXISTS idx_content_gen_log_created ON content_generation_log(created_at);
CREATE INDEX IF NOT EXISTS idx_content_gen_log_model ON content_generation_log(model_used);

-- Enable RLS
ALTER TABLE content_generation_log ENABLE ROW LEVEL SECURITY;

-- Allow public read for admin dashboard
CREATE POLICY "Content generation logs are viewable by everyone"
  ON content_generation_log FOR SELECT
  USING (true);

COMMENT ON TABLE content_generation_log IS 'Audit log of all AI content generation attempts';
COMMENT ON COLUMN content_generation_log.content_type IS 'rules, setup, reference, or all';
COMMENT ON COLUMN content_generation_log.status IS 'success, failed, partial';
COMMENT ON COLUMN content_generation_log.prompt_version IS 'Track which version of prompts generated this content';
