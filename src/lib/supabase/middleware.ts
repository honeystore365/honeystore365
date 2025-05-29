import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    // Vérifier que les variables d'environnement sont présentes
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      return NextResponse.next();
    }

    let supabaseResponse = NextResponse.next({
      request,
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
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
        cookieEncoding: 'base64url',
      }
    )

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
    return NextResponse.next();
  }
}

export const config = {
  matcher: [
    /*
     * Matcher plus spécifique pour éviter les conflits
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|css|js)$).*)',
    '/admin/:path*',
  ],
}