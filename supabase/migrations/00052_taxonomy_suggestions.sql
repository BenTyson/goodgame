-- =====================================================
-- TAXONOMY SUGGESTIONS TABLE
-- Stores AI-generated taxonomy suggestions for admin review
-- =====================================================

CREATE TABLE taxonomy_suggestions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id UUID NOT NULL REFERENCES games(id) ON DELETE CASCADE,

  -- Suggestion type: existing taxonomy or new suggestion
  suggestion_type VARCHAR(20) NOT NULL CHECK (
    suggestion_type IN ('theme', 'player_experience', 'new_theme', 'new_experience')
  ),

  -- For existing taxonomy references
  target_id UUID,  -- References themes.id or player_experiences.id

  -- For new taxonomy suggestions
  suggested_name VARCHAR(100),
  suggested_description TEXT,

  -- AI confidence and reasoning
  confidence DECIMAL(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  reasoning TEXT,

  -- Whether this should be the primary taxonomy for its type
  is_primary BOOLEAN DEFAULT FALSE,

  -- Workflow status
  status VARCHAR(20) DEFAULT 'pending' CHECK (
    status IN ('pending', 'accepted', 'rejected')
  ),

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  processed_at TIMESTAMPTZ,
  processed_by UUID REFERENCES auth.users(id)
);

-- =====================================================
-- INDEXES
-- =====================================================
CREATE INDEX idx_taxonomy_suggestions_game ON taxonomy_suggestions(game_id);
CREATE INDEX idx_taxonomy_suggestions_status ON taxonomy_suggestions(status);
CREATE INDEX idx_taxonomy_suggestions_type ON taxonomy_suggestions(suggestion_type);
CREATE INDEX idx_taxonomy_suggestions_game_status ON taxonomy_suggestions(game_id, status);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================
ALTER TABLE taxonomy_suggestions ENABLE ROW LEVEL SECURITY;

-- Admins can read all suggestions (via service role)
-- No public access needed - this is admin-only

-- =====================================================
-- COMMENTS
-- =====================================================
COMMENT ON TABLE taxonomy_suggestions IS 'AI-generated taxonomy suggestions pending admin review';
COMMENT ON COLUMN taxonomy_suggestions.suggestion_type IS 'Type: theme, player_experience, new_theme, new_experience';
COMMENT ON COLUMN taxonomy_suggestions.target_id IS 'References existing themes.id or player_experiences.id for suggestion_type theme/player_experience';
COMMENT ON COLUMN taxonomy_suggestions.suggested_name IS 'For new_theme/new_experience: the suggested taxonomy name';
COMMENT ON COLUMN taxonomy_suggestions.confidence IS 'AI confidence score 0.00-1.00';
COMMENT ON COLUMN taxonomy_suggestions.status IS 'Workflow: pending -> accepted/rejected';
