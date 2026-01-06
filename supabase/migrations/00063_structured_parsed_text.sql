-- =====================================================
-- STRUCTURED PARSED TEXT
-- Adds column for categorized/cleaned rulebook text
-- for future AI Q&A features
-- =====================================================

-- Add structured parsed text column to rulebook_parse_log
ALTER TABLE rulebook_parse_log
ADD COLUMN IF NOT EXISTS parsed_text_structured JSONB;

-- Add comment explaining the structure
COMMENT ON COLUMN rulebook_parse_log.parsed_text_structured IS
'Structured/cleaned rulebook text with categorized sections. Schema:
{
  "version": 1,
  "cleanedText": "full cleaned text",
  "sections": [{
    "type": "components|setup|gameplay|turns|actions|scoring|variants|glossary|overview|faq|other",
    "title": "Original Section Title",
    "content": "Section content",
    "wordCount": 150
  }],
  "metadata": {
    "totalSections": 8,
    "totalWords": 5000,
    "cleaningApplied": ["ligatures", "artifacts", "whitespace"]
  }
}';

-- Index for games that have structured text (for querying)
CREATE INDEX IF NOT EXISTS idx_rulebook_parse_structured
ON rulebook_parse_log(game_id)
WHERE parsed_text_structured IS NOT NULL;
