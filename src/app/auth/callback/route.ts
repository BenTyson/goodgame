/**
 * Supabase Auth Callback
 * Handles redirects from Supabase after OAuth or magic link
 */

import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { Database } from '@/types/supabase'

// Check if email is in admin list
function isAdminEmail(email: string | undefined): boolean {
  if (!email) return false
  const adminEmails = process.env.ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()) || []
  return adminEmails.includes(email.toLowerCase())
}

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  const error = requestUrl.searchParams.get('error')
  const errorDescription = requestUrl.searchParams.get('error_description')
  const next = requestUrl.searchParams.get('next') || '/'

  // Use env var for base URL (request.url returns localhost behind proxies)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || requestUrl.origin

  // Handle OAuth errors
  if (error) {
    console.error('Auth error:', error, errorDescription)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(errorDescription || error)}`, baseUrl)
    )
  }

  if (code) {
    const cookieStore = await cookies()

    const supabase = createServerClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            try {
              cookiesToSet.forEach(({ name, value, options }) => {
                cookieStore.set(name, value, options)
              })
            } catch (error) {
              // Handle cookie errors in edge cases
              console.error('Cookie error:', error)
            }
          },
        },
      }
    )

    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (!exchangeError && data.user) {
      // Check if user is an admin and update their profile role
      if (isAdminEmail(data.user.email)) {
        // Use service role to bypass RLS and update profile
        const adminClient = createClient<Database>(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )

        await adminClient
          .from('user_profiles')
          .update({ role: 'admin' })
          .eq('id', data.user.id)
      }

      // Successful auth - redirect to intended destination
      return NextResponse.redirect(new URL(next, baseUrl))
    }

    console.error('Code exchange error:', exchangeError)
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(exchangeError?.message || 'Unknown error')}`, baseUrl)
    )
  }

  // No code provided
  return NextResponse.redirect(new URL('/login?error=no_code', baseUrl))
}
