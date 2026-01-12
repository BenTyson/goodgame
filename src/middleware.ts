import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Security headers to apply to all responses
const securityHeaders = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-DNS-Prefetch-Control': 'on',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
}

export async function middleware(request: NextRequest) {
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
    '/((?!_next/static|_next/image|favicon.ico|api/admin/game-documents|api/admin/upload|api/admin/rulebook/upload|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
