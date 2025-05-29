import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  try {
    // Vérifier que les variables d'environnement sont présentes
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return supabaseResponse; // Return the initialized response
    }

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

    // Ne pas exécuter d'authentification pour les routes publiques
    const isPublicRoute = request.nextUrl.pathname.startsWith('/auth/') ||
                         request.nextUrl.pathname === '/' ||
                         request.nextUrl.pathname.startsWith('/api/');

    if (isPublicRoute) {
      return supabaseResponse;
    }

    // Vérification de l'utilisateur uniquement pour les routes protégées
    const {
      data: { user },
      error
    } = await supabase.auth.getUser()

    if (error) {
      console.error('Auth error:', error);
      return supabaseResponse;
    }

    // Vérifier l'accès admin uniquement pour les routes /admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      const userRole =
        user?.user_metadata?.role ||
        user?.user_metadata?.["role"] ||
        user?.app_metadata?.role ||
        user?.app_metadata?.["role"];

      if (!user || userRole !== 'admin') {
        const url = request.nextUrl.clone()
        url.pathname = '/auth/login'
        return NextResponse.redirect(url)
      }
    }

    return supabaseResponse;
    
  } catch (error) {
    console.error('Middleware error:', error);
    return supabaseResponse; // Return the initialized response
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
 
// The return statement for supabaseResponse is now at the end of the try block or in the catch block.
// The original comment block about returning supabaseResponse is now redundant.

export const config = {
  matcher: [
    /*
     * Matcher plus spécifique pour éviter les conflits
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    '/admin/:path*',
  ],
}