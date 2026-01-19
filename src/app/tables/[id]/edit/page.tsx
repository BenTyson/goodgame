import { Metadata } from 'next'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { getTableWithDetails } from '@/lib/supabase/table-queries'
import { EditTableForm } from './EditTableForm'

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

  return {
    title: `Edit ${table.title || table.game.name} | Boardmello`,
  }
}

export default async function EditTablePage({ params }: PageProps) {
  const { id } = await params
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect(`/login?redirect=/tables/${id}/edit`)
  }

  const table = await getTableWithDetails(id, user.id, supabase)

  if (!table) {
    notFound()
  }

  // Only host can edit
  if (table.host.id !== user.id) {
    redirect(`/tables/${id}`)
  }

  // Can't edit cancelled or completed tables
  if (table.status !== 'scheduled') {
    redirect(`/tables/${id}`)
  }

  return (
    <div className="container max-w-2xl py-8">
      <EditTableForm table={table} />
    </div>
  )
}
