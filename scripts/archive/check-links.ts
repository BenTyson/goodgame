import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  // Check category links
  const { count: categoryLinks } = await supabase
    .from('game_categories')
    .select('*', { count: 'exact', head: true })

  // Check mechanic links
  const { count: mechanicLinks } = await supabase
    .from('game_mechanics')
    .select('*', { count: 'exact', head: true })

  // Check theme links
  const { count: themeLinks } = await supabase
    .from('game_themes')
    .select('*', { count: 'exact', head: true })

  // Check experience links
  const { count: expLinks } = await supabase
    .from('game_player_experiences')
    .select('*', { count: 'exact', head: true })

  console.log('Existing junction table counts:')
  console.log('  game_categories:', categoryLinks)
  console.log('  game_mechanics:', mechanicLinks)
  console.log('  game_themes:', themeLinks)
  console.log('  game_player_experiences:', expLinks)

  // Sample a game with its categories/mechanics
  const { data: sample } = await supabase
    .from('games')
    .select(`
      name,
      game_categories(categories(slug, name)),
      game_mechanics(mechanics(slug, name))
    `)
    .limit(3)

  console.log('\nSample games with categories/mechanics:')
  if (sample) {
    for (const g of sample) {
      const cats = (g.game_categories as any[])?.map((gc: any) => gc.categories?.name).filter(Boolean) || []
      const mechs = (g.game_mechanics as any[])?.map((gm: any) => gm.mechanics?.name).filter(Boolean) || []
      console.log(`  ${g.name}:`)
      console.log(`    Categories: ${cats.join(', ') || 'none'}`)
      console.log(`    Mechanics: ${mechs.join(', ') || 'none'}`)
    }
  }
}

check()
