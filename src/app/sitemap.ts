import { MetadataRoute } from 'next'
import { mockGames, mockCategories, mockCollections } from '@/data/mock-games'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodgame.guide'

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date()

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE_URL}/games`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/rules`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/score-sheets`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/categories`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/collections`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // Game hub pages
  const gamePages: MetadataRoute.Sitemap = mockGames
    .filter((game) => game.is_published)
    .map((game) => ({
      url: `${SITE_URL}/games/${game.slug}`,
      lastModified: new Date(game.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }))

  // Game rules pages
  const rulesPages: MetadataRoute.Sitemap = mockGames
    .filter((game) => game.is_published && game.has_rules)
    .map((game) => ({
      url: `${SITE_URL}/games/${game.slug}/rules`,
      lastModified: new Date(game.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  // Game score sheet pages
  const scoreSheetPages: MetadataRoute.Sitemap = mockGames
    .filter((game) => game.is_published && game.has_score_sheet)
    .map((game) => ({
      url: `${SITE_URL}/games/${game.slug}/score-sheet`,
      lastModified: new Date(game.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  // Game setup pages
  const setupPages: MetadataRoute.Sitemap = mockGames
    .filter((game) => game.is_published && game.has_setup_guide)
    .map((game) => ({
      url: `${SITE_URL}/games/${game.slug}/setup`,
      lastModified: new Date(game.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  // Game reference pages
  const referencePages: MetadataRoute.Sitemap = mockGames
    .filter((game) => game.is_published && game.has_reference)
    .map((game) => ({
      url: `${SITE_URL}/games/${game.slug}/reference`,
      lastModified: new Date(game.updated_at),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = mockCategories.map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: new Date(category.updated_at),
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Collection pages
  const collectionPages: MetadataRoute.Sitemap = mockCollections
    .filter((collection) => collection.is_published)
    .map((collection) => ({
      url: `${SITE_URL}/collections/${collection.slug}`,
      lastModified: new Date(collection.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    }))

  return [
    ...staticPages,
    ...gamePages,
    ...rulesPages,
    ...scoreSheetPages,
    ...setupPages,
    ...referencePages,
    ...categoryPages,
    ...collectionPages,
  ]
}
