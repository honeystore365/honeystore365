import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { isAdminEmail } from '@/lib/auth/admin-auth'

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
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  const requestPath = request.nextUrl.pathname;

  console.log(`[Middleware] Path: ${requestPath}`);

  // Protect admin routes
  if (requestPath.startsWith('/admin')) {
    console.log('[Middleware] Admin route detected');
    if (!user) {
      console.log('[Middleware] No user found, redirecting to login.');
      // Not logged in, redirect to the main login page
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('message', 'Please log in to access the admin panel.');
      url.searchParams.set('redirect', requestPath);
      return NextResponse.redirect(url)
    }

    const userIsAdmin = isAdminEmail(user.email || '');
    console.log(`[Middleware] User: ${user.email}, Is Admin: ${userIsAdmin}`);

    if (!userIsAdmin) {
      console.log('[Middleware] User is not admin, redirecting to unauthorized.');
      // Logged in but not an admin, redirect to unauthorized page
      const url = request.nextUrl.clone()
      url.pathname = '/unauthorized'
      return NextResponse.redirect(url)
    }
    console.log('[Middleware] Admin access granted.');
  }

  // Protect admin API routes
  if (requestPath.startsWith('/api/admin')) {
    if (!user || !isAdminEmail(user.email || '')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }
  }

  // Block admin from accessing user cart/checkout
  if (user && isAdminEmail(user.email || '')) {
    if (requestPath.startsWith('/cart') || requestPath.startsWith('/checkout')) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin' // Redirect to admin dashboard
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}