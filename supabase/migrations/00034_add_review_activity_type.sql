-- Migration: Add review activity type
-- Adds 'review' to the activity_type enum

ALTER TYPE activity_type ADD VALUE 'review';
