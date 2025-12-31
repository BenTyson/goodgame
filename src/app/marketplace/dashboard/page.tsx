import { redirect } from 'next/navigation'
import { Metadata } from 'next'

import { createClient } from '@/lib/supabase/server'
import { getSellerDashboardData } from '@/lib/supabase/dashboard-queries'
import { SellerDashboardClient } from './SellerDashboardClient'

export const metadata: Metadata = {
  title: 'Seller Dashboard',
  description: 'Manage your marketplace activity, offers, and transactions',
}

export default async function SellerDashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login?redirect=/marketplace/dashboard')
  }

  // Get all dashboard data in one call
  const dashboardData = await getSellerDashboardData(user.id)

  return <SellerDashboardClient data={dashboardData} />
}
