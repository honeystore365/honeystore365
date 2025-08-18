import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { isAdminEmail } from '@/lib/auth/admin-auth';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value));
            response = NextResponse.next({
              request: {
                headers: request.headers,
              },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user }, error } = await supabase.auth.getUser();

    // Gestion des erreurs d'authentification
    if (error && (
      error.message.includes('Invalid Refresh Token') ||
      error.message.includes('Refresh Token Not Found') ||
      error.message.includes('AuthApiError')
    )) {
      response.cookies.delete('sb-access-token');
      response.cookies.delete('sb-refresh-token');
      
      if (request.nextUrl.pathname.startsWith('/profile') ||
          request.nextUrl.pathname.startsWith('/admin') ||
          request.nextUrl.pathname.startsWith('/cart')) {
        const redirectUrl = new URL('/auth/login', request.url);
        redirectUrl.searchParams.set('message', 'Session expired. Please log in again.');
        redirectUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(redirectUrl);
      }
    }

    // Protection spéciale des routes admin
    if (request.nextUrl.pathname.startsWith('/admin')) {
      // Pas d'utilisateur connecté = redirection vers login admin
      if (!user) {
        const loginUrl = new URL('/admin/login', request.url);
        loginUrl.searchParams.set('redirect', request.nextUrl.pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Utilisateur connecté mais pas admin = accès refusé
      if (!isAdminEmail(user.email || '')) {
        console.warn('Non-admin user attempted admin access:', {
          userEmail: user.email,
          path: request.nextUrl.pathname
        });
        return NextResponse.redirect(new URL('/unauthorized', request.url));
      }

      // Admin connecté = accès autorisé
      console.log('Admin access granted:', {
        adminEmail: user.email,
        path: request.nextUrl.pathname
      });
    }

    // Protection des routes API admin
    if (request.nextUrl.pathname.startsWith('/api/admin')) {
      if (!user || !isAdminEmail(user.email || '')) {
        return NextResponse.json(
          { error: 'Admin access required' },
          { status: 403 }
        );
      }
    }

    // Bloquer l'accès au panier pour les admins
    if (user && isAdminEmail(user.email || '')) {
      const cartRoutes = ['/cart', '/checkout'];
      if (cartRoutes.some(route => request.nextUrl.pathname.startsWith(route))) {
        console.log('Admin attempted to access cart:', {
          adminEmail: user.email,
          path: request.nextUrl.pathname
        });
        return NextResponse.redirect(new URL('/admin', request.url));
      }
    }

    return response;
  } catch (error) {
    console.warn('Middleware auth error:', error);
    return response;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};