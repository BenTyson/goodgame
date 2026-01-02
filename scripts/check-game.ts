import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

async function main() {
  // Check if there's a game_publishers join table
  const { data: gamePublishers, error: gpError } = await supabase
    .from('game_publishers')
    .select('*, publisher:publishers(*)')
    .eq('game_id', '7fe8b5de-a5d1-495b-92e4-3d4a7ab26982')
  
  console.log('Game publishers join:', gamePublishers)
  if (gpError) console.log('Join error:', gpError.message)

  // Also check if KOSMOS exists in publishers table
  const { data: kosmos } = await supabase
    .from('publishers')
    .select('*')
    .ilike('name', '%KOSMOS%')
  
  console.log('\nKOSMOS in publishers table:', JSON.stringify(kosmos, null, 2))
}

main()
