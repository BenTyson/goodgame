// Mock data for development until Supabase is connected
import type { GameRow, Category, GameImage, Collection } from '@/types/database'

export const mockCategories: Category[] = [
  {
    id: '1',
    slug: 'strategy',
    name: 'Strategy',
    description: 'Games that emphasize strategic thinking and planning',
    icon: 'brain',
    display_order: 1,
    is_primary: true,
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    slug: 'family',
    name: 'Family',
    description: 'Games suitable for the whole family',
    icon: 'users',
    display_order: 2,
    is_primary: true,
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    slug: 'party',
    name: 'Party',
    description: 'Social games for larger groups',
    icon: 'party-popper',
    display_order: 3,
    is_primary: true,
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    slug: 'cooperative',
    name: 'Cooperative',
    description: 'Games where players work together',
    icon: 'handshake',
    display_order: 4,
    is_primary: true,
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    slug: 'two-player',
    name: 'Two-Player',
    description: 'Games designed for two players',
    icon: 'user-2',
    display_order: 5,
    is_primary: true,
    meta_title: null,
    meta_description: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

// Mock games can omit the newer tracking fields
type GameWithCategories = Omit<GameRow, 'data_source' | 'field_sources' | 'wikidata_id' | 'rulebook_url' | 'rulebook_source' | 'rulebook_parsed_at' | 'bncs_score' | 'bncs_breakdown' | 'bncs_generated_at' | 'component_list' | 'latest_parse_log_id' | 'has_unimported_relations'> & {
  data_source?: string | null
  field_sources?: Record<string, unknown> | null
  wikidata_id?: string | null
  rulebook_url?: string | null
  rulebook_source?: string | null
  rulebook_parsed_at?: string | null
  bncs_score?: number | null
  bncs_breakdown?: Record<string, unknown> | null
  bncs_generated_at?: string | null
  component_list?: Record<string, unknown> | null
  latest_parse_log_id?: string | null
  has_unimported_relations?: boolean | null
  categories: Pick<Category, 'slug' | 'name'>[]
  images?: GameImage[]
}

export const mockGames: GameWithCategories[] = [
  {
    id: '1',
    slug: 'catan',
    name: 'Catan',
    tagline: 'Trade, build, settle - the classic gateway game',
    description:
      'In Catan, players try to be the first to reach 10 victory points by building settlements, cities, and roads.',
    player_count_min: 3,
    player_count_max: 4,
    player_count_best: [4],
    play_time_min: 60,
    play_time_max: 120,
    min_age: 10,
    weight: 2.3,
    year_published: 1995,
    designers: ['Klaus Teuber'],
    publisher: 'Catan Studio',
    bgg_id: 13,
    amazon_asin: 'B00U26V4VQ',
    has_rules: true,
    has_score_sheet: true,
    has_setup_guide: true,
    has_reference: true,
    family_id: null,
    complexity_tier_id: null,
    bgg_last_synced: null,
    bgg_raw_data: null,
    content_generated_at: null,
    content_reviewed_at: null,
    content_reviewed_by: null,
    content_status: 'published',
    content_version: 1,
    content_notes: null,
    priority: 3,
    rules_content: null,
    setup_content: null,
    reference_content: null,
    box_image_url: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__imagepage/img/M_3Qc0M0k3jLKBVPZKzL0Tc7nIg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2419375.jpg',
    hero_image_url: null,
    thumbnail_url: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__thumb/img/8a9HeqFydO7Uun_le9bXWPnidcA=/fit-in/200x150/filters:strip_icc()/pic2419375.jpg',
    meta_title: null,
    meta_description: null,
    is_published: true,
    is_featured: true,
    is_trending: false,
    is_top_rated: false,
    is_staff_pick: false,
    is_hidden_gem: false,
    is_new_release: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: [
      { slug: 'strategy', name: 'Strategy' },
      { slug: 'family', name: 'Family' },
    ],
    images: [
      {
        id: 'catan-1',
        game_id: '1',
        url: 'https://cf.geekdo-images.com/W3Bsga_uLP9kO91gZ7H8yw__imagepage/img/M_3Qc0M0k3jLKBVPZKzL0Tc7nIg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2419375.jpg',
        alt_text: 'Catan box cover',
        caption: 'The classic gateway game that started it all',
        image_type: 'cover',
        display_order: 0,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'catan-2',
        game_id: '1',
        url: 'https://cf.geekdo-images.com/0wuxXJxdU8EsT6e0BDXHFQ__imagepage/img/xRz77b7-iV0KDwL5UZ2VdnMVlUo=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7466612.jpg',
        alt_text: 'Catan game in progress',
        caption: 'A typical game setup with the hexagonal board',
        image_type: 'gameplay',
        display_order: 1,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'catan-3',
        game_id: '1',
        url: 'https://cf.geekdo-images.com/0SEhPLLfPwmzLpHvkhQdag__imagepage/img/EYwOoCZiJqk1xKmZZcPYkVUawR0=/fit-in/900x600/filters:no_upscale():strip_icc()/pic7466613.jpg',
        alt_text: 'Catan components',
        caption: 'Resource cards, development cards, and player pieces',
        image_type: 'components',
        display_order: 2,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '2',
    slug: 'wingspan',
    name: 'Wingspan',
    tagline: 'A competitive bird-collection engine-building game',
    description:
      'Wingspan is a relaxing, award-winning strategy card game about birds for 1-5 players.',
    player_count_min: 1,
    player_count_max: 5,
    player_count_best: [3, 4],
    play_time_min: 40,
    play_time_max: 70,
    min_age: 10,
    weight: 2.4,
    year_published: 2019,
    designers: ['Elizabeth Hargrave'],
    publisher: 'Stonemaier Games',
    bgg_id: 266192,
    amazon_asin: 'B07YQ641NQ',
    has_rules: true,
    has_score_sheet: true,
    has_setup_guide: true,
    has_reference: true,
    family_id: null,
    complexity_tier_id: null,
    bgg_last_synced: null,
    bgg_raw_data: null,
    content_generated_at: null,
    content_reviewed_at: null,
    content_reviewed_by: null,
    content_status: 'published',
    content_version: 1,
    content_notes: null,
    priority: 3,
    rules_content: null,
    setup_content: null,
    reference_content: null,
    box_image_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__imagepage/img/aVgLcuZWXhG8HqCgMOWCndnnvHQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4458123.jpg',
    hero_image_url: null,
    thumbnail_url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/St0BHEH0q28P9WNdskXNCdkR8mc=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg',
    meta_title: null,
    meta_description: null,
    is_published: true,
    is_featured: true,
    is_trending: false,
    is_top_rated: false,
    is_staff_pick: false,
    is_hidden_gem: false,
    is_new_release: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: [
      { slug: 'strategy', name: 'Strategy' },
      { slug: 'family', name: 'Family' },
    ],
    images: [
      {
        id: 'wingspan-1',
        game_id: '2',
        url: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__imagepage/img/aVgLcuZWXhG8HqCgMOWCndnnvHQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4458123.jpg',
        alt_text: 'Wingspan box cover',
        caption: 'Award-winning bird-collection game',
        image_type: 'cover',
        display_order: 0,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'wingspan-2',
        game_id: '2',
        url: 'https://cf.geekdo-images.com/P6Ni6oy2TV7Zo3bIqDZNpA__imagepage/img/WUjfcuMSV8NzVYNWMVL_3hWPcfc=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4489504.jpg',
        alt_text: 'Wingspan game components',
        caption: 'Beautiful bird cards and custom dice tower',
        image_type: 'components',
        display_order: 1,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'wingspan-3',
        game_id: '2',
        url: 'https://cf.geekdo-images.com/MRDHCg4x-t5vYEUIPApdCw__imagepage/img/9KDTr7glOvGu0k1YQTgcTI0qXdQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic4764866.jpg',
        alt_text: 'Wingspan gameplay',
        caption: 'Player board with birds in three habitats',
        image_type: 'gameplay',
        display_order: 2,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '3',
    slug: 'ticket-to-ride',
    name: 'Ticket to Ride',
    tagline: 'Build train routes across America',
    description:
      'Ticket to Ride is a cross-country train adventure where players collect cards and claim railway routes.',
    player_count_min: 2,
    player_count_max: 5,
    player_count_best: [4],
    play_time_min: 30,
    play_time_max: 60,
    min_age: 8,
    weight: 1.8,
    year_published: 2004,
    designers: ['Alan R. Moon'],
    publisher: 'Days of Wonder',
    bgg_id: 9209,
    amazon_asin: 'B0002TV2LU',
    has_rules: true,
    has_score_sheet: true,
    has_setup_guide: true,
    has_reference: true,
    family_id: null,
    complexity_tier_id: null,
    bgg_last_synced: null,
    bgg_raw_data: null,
    content_generated_at: null,
    content_reviewed_at: null,
    content_reviewed_by: null,
    content_status: 'published',
    content_version: 1,
    content_notes: null,
    priority: 3,
    rules_content: null,
    setup_content: null,
    reference_content: null,
    box_image_url: 'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__imagepage/img/NnUE_-xGDfhxjnzw33IYJELfDiQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic38668.jpg',
    hero_image_url: null,
    thumbnail_url: 'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__thumb/img/PlvAhEVdqT--X3R2mi2Wrc8Wqbw=/fit-in/200x150/filters:strip_icc()/pic38668.jpg',
    meta_title: null,
    meta_description: null,
    is_published: true,
    is_featured: true,
    is_trending: false,
    is_top_rated: false,
    is_staff_pick: false,
    is_hidden_gem: false,
    is_new_release: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: [
      { slug: 'family', name: 'Family' },
      { slug: 'strategy', name: 'Strategy' },
    ],
    images: [
      {
        id: 'ttr-1',
        game_id: '3',
        url: 'https://cf.geekdo-images.com/ZWJg0dCdrWHxVnc0eFXK8w__imagepage/img/NnUE_-xGDfhxjnzw33IYJELfDiQ=/fit-in/900x600/filters:no_upscale():strip_icc()/pic38668.jpg',
        alt_text: 'Ticket to Ride box cover',
        caption: 'The original USA map edition',
        image_type: 'cover',
        display_order: 0,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'ttr-2',
        game_id: '3',
        url: 'https://cf.geekdo-images.com/QZ1ityHWB2FMJg87g-Ew8g__imagepage/img/2PJGI2_Y2MWPDvVb3OKXz6K_sPE=/fit-in/900x600/filters:no_upscale():strip_icc()/pic588836.jpg',
        alt_text: 'Ticket to Ride game board',
        caption: 'Full game board with train routes',
        image_type: 'gameplay',
        display_order: 1,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '4',
    slug: 'azul',
    name: 'Azul',
    tagline: 'Tile-drafting with beautiful patterns',
    description:
      'In Azul, players take turns drafting colored tiles to their player board.',
    player_count_min: 2,
    player_count_max: 4,
    player_count_best: [2, 3],
    play_time_min: 30,
    play_time_max: 45,
    min_age: 8,
    weight: 1.8,
    year_published: 2017,
    designers: ['Michael Kiesling'],
    publisher: 'Plan B Games',
    bgg_id: 230802,
    amazon_asin: 'B077MZ2MPW',
    has_rules: true,
    has_score_sheet: true,
    has_setup_guide: true,
    has_reference: true,
    family_id: null,
    complexity_tier_id: null,
    bgg_last_synced: null,
    bgg_raw_data: null,
    content_generated_at: null,
    content_reviewed_at: null,
    content_reviewed_by: null,
    content_status: 'published',
    content_version: 1,
    content_notes: null,
    priority: 3,
    rules_content: null,
    setup_content: null,
    reference_content: null,
    box_image_url: 'https://cf.geekdo-images.com/tz19PfklMdAdjxV9WArraA__imagepage/img/l-0qMHo1gYFUJZ3_eEk37xvXGV4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6973671.png',
    hero_image_url: null,
    thumbnail_url: 'https://cf.geekdo-images.com/tz19PfklMdAdjxV9WArraA__thumb/img/oZ1tT6BWKNzbhZ4OZ8wT7MBZUWI=/fit-in/200x150/filters:strip_icc()/pic6973671.png',
    meta_title: null,
    meta_description: null,
    is_published: true,
    is_featured: false,
    is_trending: false,
    is_top_rated: false,
    is_staff_pick: false,
    is_hidden_gem: false,
    is_new_release: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: [
      { slug: 'family', name: 'Family' },
      { slug: 'strategy', name: 'Strategy' },
    ],
    images: [
      {
        id: 'azul-1',
        game_id: '4',
        url: 'https://cf.geekdo-images.com/tz19PfklMdAdjxV9WArraA__imagepage/img/l-0qMHo1gYFUJZ3_eEk37xvXGV4=/fit-in/900x600/filters:no_upscale():strip_icc()/pic6973671.png',
        alt_text: 'Azul box cover',
        caption: 'Beautiful Portuguese tile-laying game',
        image_type: 'cover',
        display_order: 0,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'azul-2',
        game_id: '4',
        url: 'https://cf.geekdo-images.com/TLqvjU5HvJLxbe9Z8MGNyA__imagepage/img/-fOZffJ2NZTI4B7rO8bSUHo0z1o=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3991629.jpg',
        alt_text: 'Azul tiles',
        caption: 'Colorful Azul tiles ready for drafting',
        image_type: 'components',
        display_order: 1,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '5',
    slug: 'codenames',
    name: 'Codenames',
    tagline: "Give clever clues to find your team's agents",
    description:
      'Two rival spymasters know the secret identities of 25 agents. Their teammates know the agents only by their codenames.',
    player_count_min: 2,
    player_count_max: 8,
    player_count_best: [6, 8],
    play_time_min: 15,
    play_time_max: 30,
    min_age: 14,
    weight: 1.3,
    year_published: 2015,
    designers: ['Vlaada Chvátil'],
    publisher: 'Czech Games Edition',
    bgg_id: 178900,
    amazon_asin: 'B014Q1XX9S',
    has_rules: true,
    has_score_sheet: false,
    has_setup_guide: true,
    has_reference: true,
    family_id: null,
    complexity_tier_id: null,
    bgg_last_synced: null,
    bgg_raw_data: null,
    content_generated_at: null,
    content_reviewed_at: null,
    content_reviewed_by: null,
    content_status: 'published',
    content_version: 1,
    content_notes: null,
    priority: 3,
    rules_content: null,
    setup_content: null,
    reference_content: null,
    box_image_url: 'https://cf.geekdo-images.com/F5ZBqv2BIE01l7CXCH1iPA__imagepage/img/3l_Go8bjaJPbbJQPWD_C-nNAqJA=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2582929.jpg',
    hero_image_url: null,
    thumbnail_url: 'https://cf.geekdo-images.com/F5ZBqv2BIE01l7CXCH1iPA__thumb/img/UJbCOmNDgKkuUTBGP9pxZOLsNMI=/fit-in/200x150/filters:strip_icc()/pic2582929.jpg',
    meta_title: null,
    meta_description: null,
    is_published: true,
    is_featured: true,
    is_trending: false,
    is_top_rated: false,
    is_staff_pick: false,
    is_hidden_gem: false,
    is_new_release: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: [
      { slug: 'party', name: 'Party' },
      { slug: 'family', name: 'Family' },
    ],
    images: [
      {
        id: 'codenames-1',
        game_id: '5',
        url: 'https://cf.geekdo-images.com/F5ZBqv2BIE01l7CXCH1iPA__imagepage/img/3l_Go8bjaJPbbJQPWD_C-nNAqJA=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2582929.jpg',
        alt_text: 'Codenames box cover',
        caption: 'The ultimate party word game',
        image_type: 'cover',
        display_order: 0,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'codenames-2',
        game_id: '5',
        url: 'https://cf.geekdo-images.com/sQ1hCFpwK_4ECXQ2g0D5gg__imagepage/img/5e_wJwVB2H3YKmCqQBRV1ZwWH1s=/fit-in/900x600/filters:no_upscale():strip_icc()/pic2990543.jpg',
        alt_text: 'Codenames gameplay',
        caption: 'Word grid with spymaster key card',
        image_type: 'gameplay',
        display_order: 1,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
  {
    id: '6',
    slug: 'terraforming-mars',
    name: 'Terraforming Mars',
    tagline: 'Compete to make Mars habitable',
    description:
      'In Terraforming Mars, players take on the role of corporations working to terraform the planet Mars.',
    player_count_min: 1,
    player_count_max: 5,
    player_count_best: [3, 4],
    play_time_min: 120,
    play_time_max: 180,
    min_age: 12,
    weight: 3.3,
    year_published: 2016,
    designers: ['Jacob Fryxelius'],
    publisher: 'Stronghold Games',
    bgg_id: 167791,
    amazon_asin: 'B01GSYA4K2',
    has_rules: true,
    has_score_sheet: true,
    has_setup_guide: true,
    has_reference: true,
    family_id: null,
    complexity_tier_id: null,
    bgg_last_synced: null,
    bgg_raw_data: null,
    content_generated_at: null,
    content_reviewed_at: null,
    content_reviewed_by: null,
    content_status: 'published',
    content_version: 1,
    content_notes: null,
    priority: 3,
    rules_content: null,
    setup_content: null,
    reference_content: null,
    box_image_url: 'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__imagepage/img/09uYjk2ZK_SuhhK8NN1mVqvAcYw=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3536616.jpg',
    hero_image_url: null,
    thumbnail_url: 'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__thumb/img/R7XVdTCYEJwQnBxGRgbwEn7CVXQ=/fit-in/200x150/filters:strip_icc()/pic3536616.jpg',
    meta_title: null,
    meta_description: null,
    is_published: true,
    is_featured: true,
    is_trending: false,
    is_top_rated: false,
    is_staff_pick: false,
    is_hidden_gem: false,
    is_new_release: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    categories: [{ slug: 'strategy', name: 'Strategy' }],
    images: [
      {
        id: 'tm-1',
        game_id: '6',
        url: 'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__imagepage/img/09uYjk2ZK_SuhhK8NN1mVqvAcYw=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3536616.jpg',
        alt_text: 'Terraforming Mars box cover',
        caption: 'The definitive Mars colonization game',
        image_type: 'cover',
        display_order: 0,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tm-2',
        game_id: '6',
        url: 'https://cf.geekdo-images.com/rCjAF3h6z1n_qG4gPPJEeQ__imagepage/img/sI5EWJ4h4fkQvxpAFeFzHHmN4pg=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3791227.jpg',
        alt_text: 'Terraforming Mars board',
        caption: 'The Mars board with hexagonal tiles',
        image_type: 'gameplay',
        display_order: 1,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: 'tm-3',
        game_id: '6',
        url: 'https://cf.geekdo-images.com/0S_oOJxmN4-nwFv9KdIhsg__imagepage/img/_FJJUi5c3YTn5KbU8wIhNqTxG5o=/fit-in/900x600/filters:no_upscale():strip_icc()/pic3791226.jpg',
        alt_text: 'Terraforming Mars cards',
        caption: 'Project cards that drive your corporation',
        image_type: 'components',
        display_order: 2,
        storage_path: null,
        width: 900,
        height: 600,
        file_size: null,
        is_primary: false,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ],
  },
]

// Helper to get images for a game
export function getGameImages(gameSlug: string): GameImage[] {
  const game = mockGames.find((g) => g.slug === gameSlug)
  return game?.images || []
}

// Helper to get cover image for a game
export function getGameCoverImage(gameSlug: string): GameImage | undefined {
  const images = getGameImages(gameSlug)
  return images.find((img) => img.image_type === 'cover' && img.is_primary) || images[0]
}

// Collections data
type CollectionWithGameSlugs = Collection & {
  gameSlugs: string[]
}

export const mockCollections: CollectionWithGameSlugs[] = [
  {
    id: 'c1',
    slug: 'gateway-games',
    name: 'Gateway Games',
    description:
      'Perfect games for introducing new players to the hobby. These titles feature approachable rules, reasonable play times, and engaging gameplay that hooks people on modern board games.',
    short_description: 'Perfect for introducing new players to board games',
    hero_image_url: null,
    display_order: 1,
    is_featured: true,
    is_published: true,
    meta_title: 'Gateway Board Games - Best Games for Beginners',
    meta_description:
      'Discover the best gateway board games perfect for introducing new players to the hobby. Easy to learn, fun to play.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    gameSlugs: ['catan', 'ticket-to-ride', 'azul', 'codenames'],
  },
  {
    id: 'c2',
    slug: 'under-30-minutes',
    name: 'Quick Games',
    description:
      'Games that play in 30 minutes or less. Perfect for lunch breaks, warm-up games, or when you want fast-paced fun without a lengthy time commitment.',
    short_description: 'Games that play in 30 minutes or less',
    hero_image_url: null,
    display_order: 2,
    is_featured: true,
    is_published: true,
    meta_title: 'Quick Board Games Under 30 Minutes',
    meta_description:
      'Find board games that play in 30 minutes or less. Perfect for quick gaming sessions.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    gameSlugs: ['azul', 'codenames'],
  },
  {
    id: 'c3',
    slug: 'best-at-2-players',
    name: 'Best at Two Players',
    description:
      'Games that shine with exactly two players. Whether you\'re looking for head-to-head competition or cooperative adventures, these games are ideal for couples, friends, or parent-child game nights.',
    short_description: 'Games that shine with exactly two players',
    hero_image_url: null,
    display_order: 3,
    is_featured: true,
    is_published: true,
    meta_title: 'Best 2 Player Board Games',
    meta_description:
      'Discover the best board games for two players. Perfect for couples and head-to-head gaming.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    gameSlugs: ['azul', 'ticket-to-ride'],
  },
  {
    id: 'c4',
    slug: 'engine-builders',
    name: 'Engine Builders',
    description:
      'Games where you build up systems that generate resources, actions, or points over time. The satisfaction of watching your engine come together is what makes these games so rewarding.',
    short_description: 'Build systems that generate resources and points',
    hero_image_url: null,
    display_order: 4,
    is_featured: false,
    is_published: true,
    meta_title: 'Best Engine Building Board Games',
    meta_description:
      'Explore the best engine building board games where you create powerful combos and systems.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    gameSlugs: ['wingspan', 'terraforming-mars'],
  },
  {
    id: 'c5',
    slug: 'heavy-strategy',
    name: 'Heavy Strategy',
    description:
      'Complex games for experienced players who want deep strategic decisions. These games reward planning, adaptation, and mastery over multiple plays.',
    short_description: 'Complex games for experienced players',
    hero_image_url: null,
    display_order: 5,
    is_featured: false,
    is_published: true,
    meta_title: 'Heavy Strategy Board Games',
    meta_description:
      'Find complex strategy board games for experienced players seeking deep gameplay.',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    gameSlugs: ['terraforming-mars'],
  },
]

// Helper to get games in a collection
export function getCollectionGames(collectionSlug: string): GameWithCategories[] {
  const collection = mockCollections.find((c) => c.slug === collectionSlug)
  if (!collection) return []
  return collection.gameSlugs
    .map((slug) => mockGames.find((g) => g.slug === slug))
    .filter((g): g is GameWithCategories => g !== undefined)
}

// Helper to get collections for a game
export function getGameCollections(gameSlug: string): Collection[] {
  return mockCollections.filter((c) => c.gameSlugs.includes(gameSlug))
}

// Helper to get related games based on category, player count, and complexity
export function getRelatedGames(
  gameSlug: string,
  limit: number = 4
): GameWithCategories[] {
  const currentGame = mockGames.find((g) => g.slug === gameSlug)
  if (!currentGame) return []

  const currentCategories = currentGame.categories?.map((c) => c.slug) || []

  // Score each game based on similarity
  const scoredGames = mockGames
    .filter((g) => g.slug !== gameSlug && g.is_published)
    .map((game) => {
      let score = 0

      // Category overlap (most important)
      const gameCategories = game.categories?.map((c) => c.slug) || []
      const categoryOverlap = currentCategories.filter((c) =>
        gameCategories.includes(c)
      ).length
      score += categoryOverlap * 3

      // Similar player count range
      const playerOverlap =
        Math.min(currentGame.player_count_max, game.player_count_max) -
        Math.max(currentGame.player_count_min, game.player_count_min)
      if (playerOverlap >= 0) {
        score += 2
      }

      // Similar complexity (within 1.0 weight)
      if (currentGame.weight && game.weight) {
        const weightDiff = Math.abs(currentGame.weight - game.weight)
        if (weightDiff <= 0.5) {
          score += 2
        } else if (weightDiff <= 1.0) {
          score += 1
        }
      }

      // Similar play time (within 30 min)
      if (currentGame.play_time_min && game.play_time_min) {
        const timeDiff = Math.abs(currentGame.play_time_min - game.play_time_min)
        if (timeDiff <= 15) {
          score += 1
        } else if (timeDiff <= 30) {
          score += 0.5
        }
      }

      return { game, score }
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((item) => item.game)

  return scoredGames
}

// Type export for use in pages
export type { GameWithCategories }
