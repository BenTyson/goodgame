import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getNearbyTables } from '@/lib/supabase/table-queries'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const lat = searchParams.get('lat')
  const lng = searchParams.get('lng')
  const radius = searchParams.get('radius') || '25'
  const userId = searchParams.get('userId')

  if (!lat || !lng) {
    return NextResponse.json(
      { error: 'Latitude and longitude are required' },
      { status: 400 }
    )
  }

  const latitude = parseFloat(lat)
  const longitude = parseFloat(lng)
  const radiusMiles = parseInt(radius, 10)

  if (isNaN(latitude) || isNaN(longitude)) {
    return NextResponse.json(
      { error: 'Invalid coordinates' },
      { status: 400 }
    )
  }

  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    return NextResponse.json(
      { error: 'Coordinates out of range' },
      { status: 400 }
    )
  }

  try {
    // Verify user if userId provided
    let verifiedUserId: string | undefined
    if (userId) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.id === userId) {
        verifiedUserId = userId
      }
    }

    const tables = await getNearbyTables(
      latitude,
      longitude,
      radiusMiles,
      verifiedUserId,
      50
    )

    return NextResponse.json({ tables })
  } catch (error) {
    console.error('Error fetching nearby tables:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tables' },
      { status: 500 }
    )
  }
}
