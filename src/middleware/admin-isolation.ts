/**
 * Middleware d'isolation complète admin/client
 * Empêche tout mélange entre les deux interfaces
 */

import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

// Routes exclusivement admin
const ADMIN_ROUTES = [
  '/admin',
  '/admin/login',
  '/admin/orders',
  '/admin/products',
  '/admin/customers',
  '/admin/settings',
];

// Routes exclusivement client
const CLIENT_ROUTES = [
  '/cart',
  '/checkout',
  '/products',
  '/orders',
  '/profile',
];

// Routes publiques (accessibles à tous)
const PUBLIC_ROUTES = [
  '/',
  '/about',
  '/contact',
  '/api/public',
];

export async function adminIsolationMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: any) {
          response.cookies.set(name, value, options);
        },
        remove(name: string, options: any) {
          response.cookies.set(name, '', { ...options, maxAge: 0 });
        },
      },
    }
  );
  const pathname = request.nextUrl.pathname;
  
  // Vérifier si c'est une route admin (défini en dehors du try pour être accessible dans le catch)
  const isAdminRoute = ADMIN_ROUTES.some(route => pathname.startsWith(route));

  try {
    // Obtenir la session utilisateur
    const { data: { session } } = await supabase.auth.getSession();
    
    // Déterminer le rôle utilisateur
    let userRole: 'admin' | 'client' | null = null;
    if (session?.user) {
      const role = session.user.user_metadata?.role || session.user.app_metadata?.role;
      userRole = role === 'admin' ? 'admin' : 'client';
    }
    const isClientRoute = CLIENT_ROUTES.some(route => pathname.startsWith(route));
    const isPublicRoute = PUBLIC_ROUTES.some(route => pathname === route || pathname.startsWith(route));

    // Logique d'isolation
    if (isAdminRoute) {
      // Routes admin : seuls les admins peuvent accéder
      if (!session) {
        // Pas connecté : rediriger vers login admin
        if (pathname !== '/admin/login') {
          return NextResponse.redirect(new URL('/admin/login', request.url));
        }
      } else if (userRole !== 'admin') {
        // Connecté mais pas admin : interdire l'accès
        return NextResponse.redirect(new URL('/', request.url));
      }
    } else if (isClientRoute) {
      // Routes client : interdites aux admins
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
      
      // Certaines routes client nécessitent une connexion
      if (!session && (pathname.startsWith('/orders') || pathname.startsWith('/profile'))) {
        return NextResponse.redirect(new URL('/login', request.url));
      }
    } else if (pathname === '/') {
      // Page d'accueil : rediriger les admins vers leur dashboard
      if (userRole === 'admin') {
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }

    // Ajouter des headers pour identifier le contexte
    if (isAdminRoute && userRole === 'admin') {
      response.headers.set('X-User-Context', 'admin');
      response.headers.set('X-Admin-Session', 'true');
    } else if (userRole === 'client') {
      response.headers.set('X-User-Context', 'client');
      response.headers.set('X-Admin-Session', 'false');
    }

    return response;

  } catch (error) {
    console.error('Erreur middleware isolation admin:', error);
    
    // En cas d'erreur, rediriger selon la route
    if (isAdminRoute) {
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }
    
    return response;
  }
}

/**
 * Vérifier si un utilisateur a les permissions admin
 */
export async function verifyAdminPermissions(request: NextRequest): Promise<boolean> {
  try {
    const response = NextResponse.next();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set(name, value, options);
          },
          remove(name: string, options: any) {
            response.cookies.set(name, '', { ...options, maxAge: 0 });
          },
        },
      }
    );

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return false;
    }

    const userRole = session.user.user_metadata?.role || session.user.app_metadata?.role;
    return userRole === 'admin';

  } catch (error) {
    console.error('Erreur vérification permissions admin:', error);
    return false;
  }
}

/**
 * Créer une réponse d'erreur pour accès non autorisé
 */
export function createUnauthorizedResponse(request: NextRequest, message: string = 'Accès non autorisé') {
  return new NextResponse(
    JSON.stringify({ 
      error: message,
      code: 'UNAUTHORIZED_ACCESS',
      timestamp: new Date().toISOString()
    }),
    {
      status: 403,
      headers: {
        'Content-Type': 'application/json',
        'X-Error-Type': 'admin-isolation',
      },
    }
  );
}

export default adminIsolationMiddleware;