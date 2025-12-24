import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { ShelfContent } from './ShelfContent'

export const metadata: Metadata = {
  title: 'Your Shelf',
  description: 'Manage your board game collection',
}

export default async function ShelfPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/shelf')
  }

  // Fetch initial shelf data server-side
  const { data: shelfData } = await supabase
    .from('user_games')
    .select(`*, game:games(*)`)
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <ShelfContent initialData={shelfData || []} profile={profile} />
}
