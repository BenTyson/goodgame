import { NextRequest, NextResponse } from 'next/server'
import { getAdminUserDetail, updateUserRole } from '@/lib/supabase/admin-user-queries'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params

    const user = await getAdminUserDetail(userId)

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error in GET /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: userId } = await params
    const body = await request.json()

    // Only allow role updates for now
    if (!body.role || !['admin', 'user'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "user"' },
        { status: 400 }
      )
    }

    await updateUserRole(userId, body.role)

    return NextResponse.json({ success: true, role: body.role })
  } catch (error) {
    console.error('Error in PATCH /api/admin/users/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
