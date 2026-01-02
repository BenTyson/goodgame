-- Migration: 00050_game_families_base_game.sql
-- Description: Add base_game_id to game_families for canonical base game reference

-- Add base_game_id column to track the canonical base game for a family
ALTER TABLE game_families
ADD COLUMN IF NOT EXISTS base_game_id UUID REFERENCES games(id) ON DELETE SET NULL;

-- Add index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_game_families_base_game ON game_families(base_game_id);

COMMENT ON COLUMN game_families.base_game_id IS 'The canonical base game for this family (usually the oldest game without expansion_of/reimplementation_of relations)';
