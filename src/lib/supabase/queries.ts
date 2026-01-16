/**
 * Supabase Queries - Barrel Export
 *
 * This file re-exports all query functions from the focused modules
 * for backward compatibility. New code should import directly from
 * the specific modules when possible.
 *
 * Module structure:
 * - game-queries.ts: Games, search, filters, score sheets, stats
 * - category-queries.ts: Categories, mechanics
 * - collection-queries.ts: Collections
 * - award-queries.ts: Awards, award categories, game awards
 * - entity-queries.ts: Designers, publishers, artists
 * - family-queries.ts: Game families, game relations
 */

// Game queries (games, search, filters, images, affiliates, score sheets, stats, documents)
export {
  createStaticClient,
  getGames,
  getFilteredGames,
  getGameBySlug,
  getFeaturedGames,
  getFeaturedGame,
  getTrendingGames,
  getCommunityStats,
  getRecentCommunityActivity,
  getGameImages,
  getAffiliateLinks,
  searchGames,
  getScoreSheetConfig,
  getGameCount,
  getAllGameSlugs,
  getGameWithDetails,
  getGameWithDetailsForAdmin,
  getRelatedGames,
  getGameDocuments,
  getAdjacentGames,
  type GameFilters,
  type AdjacentGames,
  type TrendingGame,
  type CommunityStats,
} from './game-queries'

// Category, mechanic, theme, player experience, complexity tier, and BGG alias queries
export {
  getCategories,
  getCategoryBySlug,
  getGamesByCategory,
  getAllCategorySlugs,
  getMechanics,
  getMechanicBySlug,
  getGamesByMechanic,
  getGameMechanics,
  getThemes,
  getThemeBySlug,
  getGamesByTheme,
  getGameThemes,
  getPlayerExperiences,
  getPlayerExperienceBySlug,
  getGamesByPlayerExperience,
  getGamePlayerExperiences,
  getComplexityTiers,
  getComplexityTierBySlug,
  getComplexityTierByWeight,
  getGamesByComplexityTier,
  getGameComplexityTier,
  getBGGAliasesForTarget,
  getBGGAliasByBGGId,
  resolveBGGAliases,
  createBGGAlias,
  deleteBGGAlias,
} from './category-queries'

// Collection queries
export {
  getCollections,
  getCollectionBySlug,
  getGamesInCollection,
  getAllCollectionSlugs,
} from './collection-queries'

// Award queries
export {
  getAwards,
  getAwardBySlug,
  getAwardCategories,
  getAwardWithCategories,
  getGameAwards,
  getAwardWinners,
  getRecentAwardWinners,
  getAllAwardSlugs,
  type GameAwardWithDetails,
  type AwardWinner,
} from './award-queries'

// Entity queries (designers, publishers, artists)
export {
  getDesigners,
  getDesignerBySlug,
  getGamesByDesigner,
  getGameDesigners,
  getAllDesignerSlugs,
  getPublishers,
  getPublisherBySlug,
  getGamesByPublisher,
  getGamePublishers,
  getAllPublisherSlugs,
  getPublishersWithGameCounts,
  getPublisherStats,
  getPublisherAwards,
  getArtists,
  getArtistBySlug,
  getGamesByArtist,
  getGameArtists,
  type PublisherCategory,
  type PublisherWithGameCount,
  type PublisherStats,
  type PublisherAward,
} from './entity-queries'

// Family and relation queries
export {
  getGameFamilies,
  getGameFamilyBySlug,
  getGamesInFamily,
  getGameFamilyWithGames,
  getGameFamily,
  getAllFamilySlugs,
  getFamiliesWithGameCounts,
  getGameRelations,
  getInverseGameRelations,
  getAllGameRelations,
} from './family-queries'
