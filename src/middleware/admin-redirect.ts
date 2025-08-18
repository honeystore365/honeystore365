// Middleware pour rediriger les admins vers leur interface dédiée
import { createServerClient } from '@supabase/ssr';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function adminRedirectMiddleware(request: NextRequest) {
  const response = NextResponse.next();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    }
  );

  try {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const userRole = 
        session.user.user_metadata?.role ||
        session.user.app_metadata?.role;

      const pathname = request.nextUrl.pathname;

      // Si l'utilisateur est admin
      if (userRole === 'admin') {
        // Rediriger vers /admin si il essaie d'accéder aux pages client
        const clientOnlyPaths = ['/cart', '/checkout', '/products'];
        const isClientPath = clientOnlyPaths.some(path => pathname.startsWith(path));
        
        if (isClientPath) {
          return NextResponse.redirect(new URL('/admin', request.url));
        }

        // Rediriger vers /admin si il accède à la racine
        if (pathname === '/') {
          return NextResponse.redirect(new URL('/admin', request.url));
        }
      }
      
      // Si l'utilisateur est client normal
      else {
        // Empêcher l'accès aux pages admin
        if (pathname.startsWith('/admin')) {
          return NextResponse.redirect(new URL('/', request.url));
        }
      }
    }
  } catch (error) {
    console.error('Erreur middleware admin:', error);
  }

  return response;
}

// Routes qui nécessitent une vérification admin
export const adminProtectedRoutes = [
  '/admin',
  '/admin/orders',
  '/admin/products',
  '/admin/customers',
  '/admin/settings'
];

// Routes interdites aux admins
export const clientOnlyRoutes = [
  '/cart',
  '/checkout',
  '/products'
];