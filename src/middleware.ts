import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  console.log(`[Middleware] Incoming request path: ${request.nextUrl.pathname}`);
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
      cookieEncoding: 'base64url', // Ensure base64url encoding for Supabase session cookies
    }
  )

  // Do not run code between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  // IMPORTANT: DO NOT REMOVE auth.getUser()

  const {
    data: { user },
  } = await supabase.auth.getUser()
 
  console.log(`[Middleware] User: ${user ? user.id : 'No user'}`);
  // Check if the user is authenticated and has the 'admin' role
  const userRole =
    user?.user_metadata?.role ||
    user?.user_metadata?.["role"] ||
    user?.app_metadata?.role ||
    user?.app_metadata?.["role"];
  console.log(`[Middleware] User Role: ${userRole}`);
 
  if (
    !user || userRole !== 'admin'
  ) {
    // no authenticated admin user, potentially respond by redirecting to the login page
    const url = request.nextUrl.clone()
    url.pathname = '/auth/login'
    // If the user is trying to access an admin path, redirect them
    if (request.nextUrl.pathname.startsWith('/admin')) {
        console.log(`[Middleware] Redirecting to: ${url.pathname}`);
        return NextResponse.redirect(url)
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is.
  // If you're creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

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
    '/admin/:path*', // Protect admin routes
    '/auth/login', // Allow access to login page
    '/auth/register', // Allow access to register page
    // Exclude static files and image optimization files
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}