import type { GameRow } from '@/types/database'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://goodgame.guide'
const SITE_NAME = 'Good Game'

// Base JSON-LD component
export function JsonLd({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

// Organization schema for the site
export function OrganizationJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    logo: `${SITE_URL}/logo.png`,
    sameAs: [],
  }
  return <JsonLd data={data} />
}

// WebSite schema with search action
export function WebSiteJsonLd() {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/games?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }
  return <JsonLd data={data} />
}

// Game schema (Product + Game)
interface GameJsonLdProps {
  game: GameRow & { categories?: { slug: string; name: string }[] }
}

export function GameJsonLd({ game }: GameJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Game',
    name: game.name,
    description: game.description || game.tagline,
    url: `${SITE_URL}/games/${game.slug}`,
    image: game.box_image_url,
    datePublished: game.year_published?.toString(),
    author: game.designers?.map((designer) => ({
      '@type': 'Person',
      name: designer,
    })),
    publisher: game.publisher
      ? {
          '@type': 'Organization',
          name: game.publisher,
        }
      : undefined,
    numberOfPlayers: {
      '@type': 'QuantitativeValue',
      minValue: game.player_count_min,
      maxValue: game.player_count_max,
    },
    gameDuration: game.play_time_max
      ? `PT${game.play_time_min}M/PT${game.play_time_max}M`
      : undefined,
    typicalAgeRange: game.min_age ? `${game.min_age}-` : undefined,
    genre: game.categories?.map((c) => c.name),
  }
  return <JsonLd data={data} />
}

// HowTo schema for rules pages
interface HowToJsonLdProps {
  game: GameRow
  steps: { name: string; text: string }[]
}

export function HowToJsonLd({ game, steps }: HowToJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: `How to Play ${game.name}`,
    description: `Learn how to play ${game.name} with this quick rules summary. Covers setup, gameplay, and scoring.`,
    image: game.box_image_url,
    totalTime: game.play_time_max ? `PT${game.play_time_max}M` : undefined,
    estimatedCost: {
      '@type': 'MonetaryAmount',
      currency: 'USD',
      value: '0',
    },
    supply: [
      {
        '@type': 'HowToSupply',
        name: `${game.name} board game`,
      },
    ],
    step: steps.map((step, index) => ({
      '@type': 'HowToStep',
      position: index + 1,
      name: step.name,
      text: step.text,
    })),
  }
  return <JsonLd data={data} />
}

// ItemList schema for game listings
interface ItemListJsonLdProps {
  games: (GameRow & { categories?: { slug: string; name: string }[] })[]
  name: string
  description: string
}

export function ItemListJsonLd({ games, name, description }: ItemListJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name,
    description,
    numberOfItems: games.length,
    itemListElement: games.map((game, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Game',
        name: game.name,
        url: `${SITE_URL}/games/${game.slug}`,
        image: game.box_image_url,
        description: game.tagline || game.description,
      },
    })),
  }
  return <JsonLd data={data} />
}

// BreadcrumbList schema
interface BreadcrumbItem {
  name: string
  href: string
}

interface BreadcrumbJsonLdProps {
  items: BreadcrumbItem[]
}

export function BreadcrumbJsonLd({ items }: BreadcrumbJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${SITE_URL}${item.href}`,
    })),
  }
  return <JsonLd data={data} />
}

// FAQPage schema for common questions
interface FAQItem {
  question: string
  answer: string
}

interface FAQJsonLdProps {
  items: FAQItem[]
}

export function FAQJsonLd({ items }: FAQJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  }
  return <JsonLd data={data} />
}

// Collection schema (as ItemList with CollectionPage)
interface CollectionJsonLdProps {
  name: string
  description: string
  slug: string
  games: (GameRow & { categories?: { slug: string; name: string }[] })[]
}

export function CollectionJsonLd({
  name,
  description,
  slug,
  games,
}: CollectionJsonLdProps) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url: `${SITE_URL}/collections/${slug}`,
    mainEntity: {
      '@type': 'ItemList',
      name,
      numberOfItems: games.length,
      itemListElement: games.map((game, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'Game',
          name: game.name,
          url: `${SITE_URL}/games/${game.slug}`,
          image: game.box_image_url,
        },
      })),
    },
  }
  return <JsonLd data={data} />
}
