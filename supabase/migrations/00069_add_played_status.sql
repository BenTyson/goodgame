-- Migration: 00069_add_played_status.sql
-- Description: Add 'played' status to shelf_status enum for rating-based shelf additions
-- This allows users to rate games they've played without implying ownership

-- Add 'played' status to the shelf_status enum
ALTER TYPE shelf_status ADD VALUE IF NOT EXISTS 'played';

-- Update enum comment for documentation
COMMENT ON TYPE shelf_status IS 'Shelf status: owned, want_to_buy, want_to_play, previously_owned, wishlist, played';
