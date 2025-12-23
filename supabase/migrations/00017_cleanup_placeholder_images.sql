-- Migration: 00017_cleanup_placeholder_images.sql
-- Description: Remove old BGG placeholder images and clean up image URLs

-- Delete all game_images entries that point to BGG (placeholder images)
DELETE FROM game_images
WHERE url LIKE '%cf.geekdo-images.com%';

-- Clear the old placeholder URLs in the games table
-- These will be replaced by uploaded images from game_images table
UPDATE games
SET
  box_image_url = NULL,
  hero_image_url = NULL,
  thumbnail_url = NULL
WHERE box_image_url LIKE '%cf.geekdo-images.com%'
   OR thumbnail_url LIKE '%cf.geekdo-images.com%';
