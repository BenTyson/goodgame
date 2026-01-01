import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { AdminLayoutClient } from '@/components/admin/AdminLayoutClient'
import type { Database } from '@/types/supabase'

async function getUser() {
  const cookieStore = await cookies()

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()
  return user
}

function isAdmin(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  return adminEmails.includes(email.toLowerCase())
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await getUser()

  // Check if user is authenticated and is an admin
  if (!user || !isAdmin(user.email)) {
    redirect('/admin/login')
  }

  return (
    <AdminLayoutClient userEmail={user.email || ''}>
      {children}
    </AdminLayoutClient>
  )
}
