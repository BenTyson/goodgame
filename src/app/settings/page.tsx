import { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { SettingsContent } from './SettingsContent'

export const metadata: Metadata = {
  title: 'Settings',
  description: 'Manage your account settings',
}

export default async function SettingsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?next=/settings')
  }

  const { data: profile } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  return <SettingsContent profile={profile} userEmail={user.email || ''} />
}
