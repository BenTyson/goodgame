-- Coming soon email signups
CREATE TABLE coming_soon_signups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for admin queries
CREATE INDEX idx_coming_soon_signups_created_at ON coming_soon_signups(created_at DESC);

-- RLS policies
ALTER TABLE coming_soon_signups ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for signup form)
CREATE POLICY "Anyone can sign up for coming soon" ON coming_soon_signups
  FOR INSERT WITH CHECK (true);

-- Only service role can read (for admin export)
CREATE POLICY "Service role can read signups" ON coming_soon_signups
  FOR SELECT USING (false);
