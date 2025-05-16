import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          storage: {
            getItem: (key) => request.cookies.get(key)?.value || null,
            setItem: (key, value) => {
              supabaseResponse.cookies.set(key, value);
            },
            removeItem: (key) => {
              supabaseResponse.cookies.delete(key);
            },
          },
        },
      }
    )

    // Do not run code between createClient and
    // supabase.auth.getUser(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    const {
      data: { user },
    } = await supabase.auth.getUser()

    // Check if the user is authenticated and has the 'admin' role
    const userRole =
      user?.user_metadata?.role ||
      user?.user_metadata?.["role"] ||
      user?.app_metadata?.role ||
      user?.app_metadata?.["role"];

    if (
      !user || userRole !== 'admin'
    ) {
      // no authenticated admin user, potentially respond by redirecting to the login page
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      // If the user is trying to access an admin path, redirect them
      if (request.nextUrl.pathname.startsWith('/admin')) {
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
  } catch (err) {
    console.error("Middleware error:", err);
    return new NextResponse("Internal middleware error", { status: 500 });
  }
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
    '/admin/:path*', // Protect admin routes
    '/auth/login', // Allow access to login page
    '/auth/register', // Allow access to register page
  ],
}
