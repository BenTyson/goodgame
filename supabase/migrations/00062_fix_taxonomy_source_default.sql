-- Fix existing taxonomy assignments that defaulted to 'manual'
-- These actually came from BGG import, so update them accordingly

UPDATE game_categories SET source = 'bgg' WHERE source = 'manual' OR source IS NULL;
UPDATE game_mechanics SET source = 'bgg' WHERE source = 'manual' OR source IS NULL;
UPDATE game_themes SET source = 'bgg' WHERE source = 'manual' OR source IS NULL;

-- Change default to NULL so future assignments require explicit source
ALTER TABLE game_categories ALTER COLUMN source DROP DEFAULT;
ALTER TABLE game_mechanics ALTER COLUMN source DROP DEFAULT;
ALTER TABLE game_themes ALTER COLUMN source DROP DEFAULT;
