// middleware.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          request.cookies.set({ name, value, ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value, ...options });
        },
        remove(name: string, options: CookieOptions) {
          request.cookies.set({ name, value: '', ...options });
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          });
          response.cookies.set({ name, value: '', ...options });
        },
      },
    }
  );

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  // Récupération robuste du rôle
  const userRole =
    user?.user_metadata?.role ||
    user?.user_metadata?.["role"] ||
    user?.role ||
    user?.app_metadata?.role ||
    user?.app_metadata?.["role"];

  // Si l'utilisateur essaie d'accéder à une page admin
  if (request.nextUrl.pathname.startsWith('/admin')) {
    console.log('Middleware: Accessing /admin path');
    console.log('Middleware: User object:', user);
    console.log('Middleware: Extracted user role:', userRole);
    // S'il n'est pas connecté OU n'a pas le rôle admin
    if (!user || userRole !== 'admin') {
      console.log('Middleware: Admin access denied, redirecting to /auth/login');
      // Rediriger vers la page de connexion (ou une page d'accueil/erreur)
      return NextResponse.redirect(new URL('/auth/login', request.url)); // Redirige vers la page de connexion correcte
    }
     console.log('Middleware: Admin access granted');
  }

  // Si l'utilisateur connecté essaie d'accéder aux pages de connexion/inscription
  if (user && (request.nextUrl.pathname.startsWith('/auth/login') || request.nextUrl.pathname.startsWith('/auth/register'))) {
     console.log('Middleware: Logged in user accessing auth pages, redirecting to /');
     return NextResponse.redirect(new URL('/', request.url)); // Rediriger vers la page d'accueil par exemple
  }

  // Redirection après connexion depuis la page d'accueil
  if (request.nextUrl.pathname === '/' && userRole === 'admin') {
      console.log('Middleware: Admin user accessing /, redirecting to /admin');
      return NextResponse.redirect(new URL('/admin', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - _next/webpack-hmr (WebSocket HMR)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|_next/webpack-hmr|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    // Protected paths
    '/admin/:path*',
    '/auth/login',
    '/auth/register',
    '/', // Also match the root path for redirection after login
  ],
};
