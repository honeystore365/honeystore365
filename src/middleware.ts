import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })

  try {
    // Alternative pour les versions très récentes de Supabase
    // const { data: { user }, error } = await supabase.auth.getUser()
    
    // Ou utiliser getSession() (recommandé)
    const { data: { session }, error } = await supabase.auth.getSession()
    
    if (error) {
      console.error('Erreur lors de la récupération de la session:', error)
      // Rediriger vers la page de connexion en cas d'erreur
      if (request.nextUrl.pathname.startsWith('/dashboard') || 
          request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(new URL('/login', request.url))
      }
      return res
    }

    const user = session?.user
    const isLoggedIn = !!user
    const isOnAuthPage = request.nextUrl.pathname === '/login' || 
                        request.nextUrl.pathname === '/register'
    const isOnProtectedPage = request.nextUrl.pathname.startsWith('/dashboard') || 
                             request.nextUrl.pathname.startsWith('/admin')

    // Si l'utilisateur est connecté et sur une page d'auth, rediriger vers dashboard
    if (isLoggedIn && isOnAuthPage) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }

    // Si l'utilisateur n'est pas connecté et sur une page protégée, rediriger vers login
    if (!isLoggedIn && isOnProtectedPage) {
      return NextResponse.redirect(new URL('/login', request.url))
    }

    return res
  } catch (error) {
    console.error('Erreur dans le middleware:', error)
    return res
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}