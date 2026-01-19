import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTableWithDetails, getTableParticipants, getTableComments, getTableRecap } from '@/lib/supabase/table-queries'
import { getMutualFriends } from '@/lib/supabase/friend-queries'
import { TableDetailContent } from './TableDetailContent'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const table = await getTableWithDetails(id, undefined, supabase)

  if (!table) {
    return { title: 'Table Not Found | Boardmello' }
  }

  const title = table.title || `${table.game.name} Table`

  return {
    title: `${title} | Boardmello`,
    description: `Join ${table.host.displayName || table.host.username || 'a host'} for ${table.game.name}`,
  }
}

export default async function TableDetailPage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const [table, participants, comments, recap] = await Promise.all([
    getTableWithDetails(id, user?.id, supabase),
    getTableParticipants(id, supabase),
    getTableComments(id, supabase),
    getTableRecap(id, supabase),
  ])

  if (!table) {
    notFound()
  }

  // Get friends for invite dialog (only if host)
  let friends: Awaited<ReturnType<typeof getMutualFriends>> = []
  if (user && user.id === table.host.id) {
    friends = await getMutualFriends(user.id)
  }

  // Get already invited user IDs
  const alreadyInvited = participants.map((p) => p.userId)

  return (
    <TableDetailContent
      table={table}
      participants={participants}
      comments={comments}
      recap={recap}
      currentUserId={user?.id}
      friends={friends}
      alreadyInvited={alreadyInvited}
    />
  )
}
