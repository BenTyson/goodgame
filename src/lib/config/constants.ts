/**
 * Application Constants
 *
 * Centralized configuration values to avoid magic numbers scattered throughout the codebase.
 * Group related constants together for easy discovery.
 */

// ===========================================
// FILTER DEFAULTS
// ===========================================

export const FILTERS = {
  PLAYER_COUNT: {
    MIN: 1,
    MAX: 8,
    STEP: 1,
  },
  PLAY_TIME: {
    MIN: 0,
    MAX: 180,
    STEP: 15,
  },
  WEIGHT: {
    MIN: 1,
    MAX: 5,
    STEP: 0.5,
  },
} as const

// ===========================================
// PAGINATION & LIMITS
// ===========================================

export const PAGINATION = {
  NOTIFICATIONS_PAGE_SIZE: 20,
  FOLLOWERS_PAGE_SIZE: 50,
  REVIEWS_PAGE_SIZE: 10,
  GAMES_PICKER_LIMIT: 10,
} as const

// ===========================================
// FILE UPLOAD
// ===========================================

export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
  MIN_FILE_SIZE: 100, // bytes
  SECURE_FILENAME_BYTES: 16,
  PREFIX_MAX_LENGTH: 50,
} as const

// ===========================================
// BGG API
// ===========================================

export const BGG_API = {
  RATE_LIMIT_MS: 1100,
  BATCH_SIZE: 20,
  IMPORT_BATCH_LIMIT: 5,
  MAX_RETRY_ATTEMPTS: 3,
  DEFAULT_SEED_COUNT: 100,
} as const

// ===========================================
// AI GENERATION
// ===========================================

export const AI = {
  MAX_TOKENS: 4096,
  MAX_RETRIES: 3,
  DESCRIPTION_MAX_LENGTH: 500,
  DESIGNERS_LIMIT: 5,
} as const

// ===========================================
// SCORE SHEETS
// ===========================================

export const SCORE_SHEET = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
} as const

// ===========================================
// SECURITY
// ===========================================

export const SECURITY = {
  MIN_SECRET_LENGTH: 32,
} as const

// ===========================================
// USER ACTIVITY
// ===========================================

export const USER = {
  LAST_ACTIVE_UPDATE_INTERVAL_MS: 5 * 60 * 1000, // 5 minutes
} as const

// ===========================================
// GAME DEFAULTS (for BGG imports)
// ===========================================

export const GAME_DEFAULTS = {
  MIN_PLAYERS: 1,
  MIN_PLAY_TIME: 30,
  MAX_PLAY_TIME: 60,
  MIN_AGE: 8,
  WEIGHT: 2.5,
} as const
