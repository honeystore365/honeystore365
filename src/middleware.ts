import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          request.cookies.set({
            name,
            value,
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
      cookieEncoding: 'base64url', // Match client configuration
    }
  )

  try {
    // Force refresh session and handle errors
    const { data: { session }, error } = await supabase.auth.getSession()
    if (error) {
      console.error('Middleware session refresh error:', error)
      // Clear invalid session cookies
      response.cookies.delete('sb-auth-token')
    } else if (session) {
      // Ensure cookies are set with proper domain
      response.cookies.set({
        name: 'sb-auth-token',
        value: session.access_token,
        domain: process.env.NODE_ENV === 'production' ? '.nectar-hives.com' : undefined,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 3600
      })
    }
  } catch (err) {
    console.error('Middleware session handling failed:', err)
  }

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static assets (.*\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    '/admin/:path*',
  ],
}
