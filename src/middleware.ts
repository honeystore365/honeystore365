import { type NextRequest, NextResponse } from 'next/server'
import { updateSession } from './lib/supabase/middleware' // Adjusted path
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const response = await updateSession(request)

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isLoggedIn = !!user
  const isOnAuthPage = request.nextUrl.pathname.startsWith('/auth/login') ||
                      request.nextUrl.pathname.startsWith('/auth/register')
  
  const isOnAdminPage = request.nextUrl.pathname.startsWith('/admin')

  if (isLoggedIn && isOnAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  if (!isLoggedIn && isOnAdminPage) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
