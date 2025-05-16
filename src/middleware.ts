import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Create an unmodified response
    let response = NextResponse.next({
      request: {
        headers: request.headers,
      },
    })

    const supabase = createMiddlewareClient(
      { req: request, res: response },
      {
        supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL!,
        supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      }
    )

    // This will refresh session if expired - otherwise just update the cookies
    await (supabase.auth as any).getSession()

    // Do not run code between createClient and
    // supabase.auth.getSession(). A simple mistake could make it very hard to debug
    // issues with users being randomly logged out.

    // IMPORTANT: DO NOT REMOVE auth.getUser()

    const {
      data: { user },
    } = await (supabase.auth as any).getUser()

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

    // IMPORTANT: You *must* return the response object as it is.
    // If you're creating a new response object with NextResponse.next() make sure to:
    // 1. Pass the request in it, like so:
    //    const myNewResponse = NextResponse.next({ request })
    // 2. Copy over the cookies, like so:
    //    myNewResponse.cookies.setAll(response.cookies.getAll())
    // 3. Change the myNewResponse object to fit your needs, but avoid changing
    //    the cookies!
    // 4. Finally:
    //    return myNewResponse
    // If this is not done, you may be causing the browser and server to go out
    // of sync and terminate the user's session prematurely!

    return response
  } catch (err) {
    console.error("Middleware error:", err);
    return new NextResponse("Internal middleware error", { status: 500 });
  }
}

export const config = {
  matcher: [
    '/((?:(?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).)*)',
    '/admin/:path*',
    '/auth/login',
    '/auth/register',
  ],
}
