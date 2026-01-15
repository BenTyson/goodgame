import { MetadataRoute } from 'next'
import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://boardmello.com'

// Static client for sitemap generation (no cookies needed)
function createStaticClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createStaticClient()
  const now = new Date()

  // Fetch all data in parallel
  const [
    { data: games },
    { data: categories },
    { data: collections },
    { data: awards },
    { data: designers },
    { data: publishers }
  ] = await Promise.all([
    supabase
      .from('games')
      .select('slug, updated_at, has_rules, has_score_sheet, has_setup_guide, has_reference')
      .eq('is_published', true),
    supabase
      .from('categories')
      .select('slug, updated_at'),
    supabase
      .from('collections')
      .select('slug, updated_at')
      .eq('is_published', true),
    supabase
      .from('awards')
      .select('slug')
      .eq('is_active', true),
    supabase
      .from('designers')
      .select('slug, updated_at'),
    supabase
      .from('publishers')
      .select('slug, updated_at')
  ])

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
      url: `${SITE_URL}/awards`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
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
    {
      url: `${SITE_URL}/designers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/publishers`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ]

  // Game hub pages
  const gamePages: MetadataRoute.Sitemap = (games || []).map((game) => ({
    url: `${SITE_URL}/games/${game.slug}`,
    lastModified: game.updated_at ? new Date(game.updated_at) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }))

  // Game rules pages
  const rulesPages: MetadataRoute.Sitemap = (games || [])
    .filter((game) => game.has_rules)
    .map((game) => ({
      url: `${SITE_URL}/games/${game.slug}/rules`,
      lastModified: game.updated_at ? new Date(game.updated_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  // Game score sheet pages
  const scoreSheetPages: MetadataRoute.Sitemap = (games || [])
    .filter((game) => game.has_score_sheet)
    .map((game) => ({
      url: `${SITE_URL}/games/${game.slug}/score-sheet`,
      lastModified: game.updated_at ? new Date(game.updated_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

  // Game setup pages
  const setupPages: MetadataRoute.Sitemap = (games || [])
    .filter((game) => game.has_setup_guide)
    .map((game) => ({
      url: `${SITE_URL}/games/${game.slug}/setup`,
      lastModified: game.updated_at ? new Date(game.updated_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  // Game reference pages
  const referencePages: MetadataRoute.Sitemap = (games || [])
    .filter((game) => game.has_reference)
    .map((game) => ({
      url: `${SITE_URL}/games/${game.slug}/reference`,
      lastModified: game.updated_at ? new Date(game.updated_at) : now,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    }))

  // Category pages
  const categoryPages: MetadataRoute.Sitemap = (categories || []).map((category) => ({
    url: `${SITE_URL}/categories/${category.slug}`,
    lastModified: category.updated_at ? new Date(category.updated_at) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Collection pages
  const collectionPages: MetadataRoute.Sitemap = (collections || []).map((collection) => ({
    url: `${SITE_URL}/collections/${collection.slug}`,
    lastModified: collection.updated_at ? new Date(collection.updated_at) : now,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  // Award pages
  const awardPages: MetadataRoute.Sitemap = (awards || []).map((award) => ({
    url: `${SITE_URL}/awards/${award.slug}`,
    lastModified: now,
    changeFrequency: 'monthly' as const,
    priority: 0.7,
  }))

  // Designer pages
  const designerPages: MetadataRoute.Sitemap = (designers || []).map((designer) => ({
    url: `${SITE_URL}/designers/${designer.slug}`,
    lastModified: designer.updated_at ? new Date(designer.updated_at) : now,
    changeFrequency: 'monthly' as const,
    priority: 0.6,
  }))

  // Publisher pages
  const publisherPages: MetadataRoute.Sitemap = (publishers || []).map((publisher) => ({
    url: `${SITE_URL}/publishers/${publisher.slug}`,
    lastModified: publisher.updated_at ? new Date(publisher.updated_at) : now,
    changeFrequency: 'monthly' as const,
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
    ...awardPages,
    ...designerPages,
    ...publisherPages,
  ]
}
