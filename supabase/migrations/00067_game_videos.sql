-- Game videos table for YouTube video embeds
CREATE TABLE IF NOT EXISTS game_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id uuid NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  youtube_url text NOT NULL,
  youtube_video_id text NOT NULL, -- Extracted video ID for embedding
  title text, -- Optional custom title (falls back to YouTube title)
  video_type text NOT NULL CHECK (video_type IN ('overview', 'gameplay', 'review')),
  display_order integer DEFAULT 0,
  is_featured boolean DEFAULT false, -- Featured video shows prominently
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  UNIQUE(game_id, youtube_video_id) -- Prevent duplicate videos per game
);

-- Index for efficient lookups
CREATE INDEX idx_game_videos_game_id ON game_videos(game_id);
CREATE INDEX idx_game_videos_type ON game_videos(video_type);

-- Enable RLS
ALTER TABLE game_videos ENABLE ROW LEVEL SECURITY;

-- Public read access
CREATE POLICY "Anyone can view game videos"
  ON game_videos FOR SELECT
  USING (true);

-- Admin write access (service role bypasses RLS)
CREATE POLICY "Service role can manage game videos"
  ON game_videos FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE game_videos IS 'YouTube video links for games with type categorization';
COMMENT ON COLUMN game_videos.video_type IS 'Type: overview (general), gameplay (walkthrough), review';
