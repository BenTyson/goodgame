-- Migration: Crunch Score System
-- Converts BNCS (1-5 scale) to Crunch Score (1-10 scale)
-- Adds BGG reference tracking for calibration

-- Step 1: Drop old constraint
ALTER TABLE games DROP CONSTRAINT IF EXISTS games_bncs_score_check;

-- Step 2: Rename columns (BNCS -> crunch)
ALTER TABLE games RENAME COLUMN bncs_score TO crunch_score;
ALTER TABLE games RENAME COLUMN bncs_breakdown TO crunch_breakdown;
ALTER TABLE games RENAME COLUMN bncs_generated_at TO crunch_generated_at;

-- Step 3: Add BGG reference tracking column
ALTER TABLE games ADD COLUMN IF NOT EXISTS crunch_bgg_reference DECIMAL(2,1);

-- Step 4: Convert existing scores from 1-5 to 1-10
-- Formula: new = (old - 1) / 4 * 9 + 1
-- Maps: 1.0 -> 1.0, 3.0 -> 5.5, 5.0 -> 10.0
UPDATE games
SET crunch_score = ROUND(((crunch_score - 1) / 4.0 * 9.0 + 1)::numeric, 1)
WHERE crunch_score IS NOT NULL;

-- Step 5: Convert breakdown dimension scores from 1-5 to 1-10
UPDATE games
SET crunch_breakdown = jsonb_build_object(
  'rulesDensity', ROUND((((crunch_breakdown->>'rulesDensity')::numeric - 1) / 4.0 * 9.0 + 1)::numeric, 1),
  'decisionSpace', ROUND((((crunch_breakdown->>'decisionSpace')::numeric - 1) / 4.0 * 9.0 + 1)::numeric, 1),
  'learningCurve', ROUND((((crunch_breakdown->>'learningCurve')::numeric - 1) / 4.0 * 9.0 + 1)::numeric, 1),
  'strategicDepth', ROUND((((crunch_breakdown->>'strategicDepth')::numeric - 1) / 4.0 * 9.0 + 1)::numeric, 1),
  'componentComplexity', ROUND((((crunch_breakdown->>'componentComplexity')::numeric - 1) / 4.0 * 9.0 + 1)::numeric, 1),
  'reasoning', crunch_breakdown->>'reasoning'
)
WHERE crunch_breakdown IS NOT NULL;

-- Step 6: Add new constraint for 1-10 scale
ALTER TABLE games ADD CONSTRAINT games_crunch_score_check
  CHECK (crunch_score >= 1 AND crunch_score <= 10);

-- Step 7: Update index
DROP INDEX IF EXISTS idx_games_bncs_score;
CREATE INDEX IF NOT EXISTS idx_games_crunch_score ON games(crunch_score) WHERE crunch_score IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN games.crunch_score IS 'Board Nomads Crunch Score (1-10 scale): AI 85% + BGG calibration 15%';
COMMENT ON COLUMN games.crunch_breakdown IS 'Crunch Score dimension breakdown (1-10 each): rulesDensity, decisionSpace, learningCurve, strategicDepth, componentComplexity';
COMMENT ON COLUMN games.crunch_bgg_reference IS 'BGG weight value (1-5) used as calibration reference when generating Crunch Score';
