import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Coming soon mode configuration
const COMING_SOON_MODE = process.env.COMING_SOON_MODE === 'true'
const COMING_SOON_BYPASS_CODE = process.env.COMING_SOON_BYPASS_CODE || 'boardmello2026'

// Security headers to apply to all responses
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Coming soon mode - redirect all traffic except allowed paths
  if (COMING_SOON_MODE) {
    // Paths that should always be accessible
    const allowedPaths = [
      '/coming-soon',
      '/admin',
      '/auth',
      '/api',
      '/_next',
      '/favicon',
    ]

    const isAllowedPath = allowedPaths.some(p => pathname.startsWith(p))

    if (!isAllowedPath) {
      // Check for bypass via URL parameter
      const bypassParam = request.nextUrl.searchParams.get('access')

      if (bypassParam === COMING_SOON_BYPASS_CODE) {
        // Valid bypass code - set cookie and redirect to clean URL
        const cleanUrl = new URL(pathname, request.url)
        const response = NextResponse.redirect(cleanUrl)
        response.cookies.set('coming_soon_bypass', 'true', {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax',
          maxAge: 60 * 60 * 24 * 30, // 30 days
        })
        return response
      }

      // Check for existing bypass cookie
      const bypassCookie = request.cookies.get('coming_soon_bypass')

      if (!bypassCookie?.value) {
        // No bypass - redirect to coming soon page
        return NextResponse.redirect(new URL('/coming-soon', request.url))
      }
    }
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if needed - this is important!
  await supabase.auth.getUser()

  // Add pathname to headers for server components
  supabaseResponse.headers.set('x-pathname', request.nextUrl.pathname)

  // Apply security headers (after supabase auth to ensure they're on the final response)
  Object.entries(securityHeaders).forEach(([key, value]) => {
    supabaseResponse.headers.set(key, value)
  })

  return supabaseResponse
}

export const config = {
  matcher: [
    // Match all routes except:
    // - Static files (_next/static, _next/image, favicon, images)
    // - API upload routes (they handle auth internally and need raw body)
    '/((?!_next/static|_next/image|favicon.ico|api/admin/game-documents|api/admin/upload|api/admin/rulebook|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
