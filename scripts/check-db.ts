import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function check() {
  const { count: total } = await supabase.from('games').select('*', { count: 'exact', head: true })
  const { count: withBgg } = await supabase.from('games').select('*', { count: 'exact', head: true }).not('bgg_raw_data', 'is', null)
  const { count: withBggId } = await supabase.from('games').select('*', { count: 'exact', head: true }).not('bgg_id', 'is', null)

  console.log('Total games:', total)
  console.log('Games with bgg_raw_data:', withBgg)
  console.log('Games with bgg_id:', withBggId)

  const { data: sample } = await supabase.from('games').select('name, bgg_id, bgg_raw_data').limit(3)
  console.log('\nSample games:')
  if (sample) {
    sample.forEach(g => {
      console.log('  -', g.name, '| bgg_id:', g.bgg_id, '| has_raw_data:', !!g.bgg_raw_data)
    })
  }
}

check()
