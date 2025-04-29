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
    // S'il n'est pas connecté OU n'a pas le rôle admin
    if (!user || userRole !== 'admin') {
      // Rediriger vers la page de connexion (ou une page d'accueil/erreur)
      return NextResponse.redirect(new URL('/login', request.url)); // Adaptez '/login' si nécessaire
    }
  }

  // Si l'utilisateur connecté essaie d'accéder aux pages de connexion/inscription
  if (user && (request.nextUrl.pathname.startsWith('/login') || request.nextUrl.pathname.startsWith('/signup'))) {
     return NextResponse.redirect(new URL('/', request.url)); // Rediriger vers la page d'accueil par exemple
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more exceptions.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
     // Ajoutez ici explicitement les chemins à protéger ou à vérifier
     '/admin/:path*', // Protège toutes les routes sous /admin
     '/login',       // Pour la redirection des utilisateurs connectés
     '/signup',      // Pour la redirection des utilisateurs connectés
  ],
};