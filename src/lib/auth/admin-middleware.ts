import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { isAdminEmail, logAdminAction } from './admin-auth';
import { logger } from '@/lib/logger';

// Middleware pour protéger les routes admin
export async function adminMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  try {
    // Créer le client Supabase pour le serveur
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value;
          },
          set(name: string, value: string, options: any) {
            response.cookies.set({ name, value, ...options });
          },
          remove(name: string, options: any) {
            response.cookies.set({ name, value: '', ...options });
          },
        },
      }
    );

    // Vérifier la session utilisateur
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      logger.error('Admin middleware: Session error', error, {
        component: 'AdminMiddleware',
        path: request.nextUrl.pathname
      });
      return redirectToLogin(request);
    }

    // Pas de session = redirection vers login
    if (!session || !session.user) {
      logger.info('Admin middleware: No session found', {
        component: 'AdminMiddleware',
        path: request.nextUrl.pathname
      });
      return redirectToLogin(request);
    }

    // Vérifier si l'utilisateur est admin
    if (!isAdminEmail(session.user.email || '')) {
      logger.warn('Admin middleware: Non-admin user attempted access', {
        component: 'AdminMiddleware',
        userEmail: session.user.email,
        path: request.nextUrl.pathname
      });
      return redirectToUnauthorized(request);
    }

    // Logger l'accès admin réussi
    logAdminAction('admin_route_access', session.user, {
      path: request.nextUrl.pathname,
      method: request.method
    });

    return response;

  } catch (error) {
    logger.error('Admin middleware: Unexpected error', error as Error, {
      component: 'AdminMiddleware',
      path: request.nextUrl.pathname
    });
    return redirectToLogin(request);
  }
}

// Redirection vers la page de connexion admin
function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL('/admin/login', request.url);
  loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

// Redirection vers page d'accès non autorisé
function redirectToUnauthorized(request: NextRequest) {
  const unauthorizedUrl = new URL('/unauthorized', request.url);
  return NextResponse.redirect(unauthorizedUrl);
}

// Vérifier si une route nécessite une protection admin
export function isAdminRoute(pathname: string): boolean {
  const adminRoutes = [
    '/admin',
    '/api/admin'
  ];
  
  return adminRoutes.some(route => pathname.startsWith(route));
}