import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  const familyId = 'eedc7e62-5293-49f1-9dcf-38f188f499c1'

  // Check family
  const { data: family } = await supabase
    .from('game_families')
    .select('*')
    .eq('id', familyId)
    .single()
  console.log('Family:', family?.name, '| base_game_id:', family?.base_game_id)

  // Check games in family with IDs
  const { data: games } = await supabase
    .from('games')
    .select('id, name, family_id, year_published')
    .eq('family_id', familyId)
  console.log('\nGames in family:', games?.length || 0)
  const gameIds = games?.map(g => g.id) || []
  games?.forEach(g => console.log(`  - ${g.id.substring(0,8)}... ${g.name} (${g.year_published})`))

  // Check relations where source is in family
  if (games && games.length > 0) {
    const { data: relations } = await supabase
      .from('game_relations')
      .select('source_game_id, target_game_id, relation_type')
      .in('source_game_id', gameIds)

    console.log('\nRelations where source is in family:', relations?.length || 0)
    for (const r of relations || []) {
      const sourceGame = games.find(g => g.id === r.source_game_id)
      const targetInFamily = gameIds.includes(r.target_game_id)

      // Get target game name
      const { data: targetGame } = await supabase
        .from('games')
        .select('name')
        .eq('id', r.target_game_id)
        .single()

      console.log(`  - ${r.relation_type}:`)
      console.log(`    Source: ${sourceGame?.name || r.source_game_id}`)
      console.log(`    Target: ${targetGame?.name || r.target_game_id} ${targetInFamily ? '(IN FAMILY)' : '(NOT IN FAMILY)'}`)
    }

    // Now filter to only relations where BOTH are in family
    const filteredRelations = (relations || []).filter(r => gameIds.includes(r.target_game_id))
    console.log('\nRelations where BOTH source and target in family:', filteredRelations.length)
  }
}

main().catch(console.error)
