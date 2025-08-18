import { createClientServer } from '@/lib/supabase/server';
import { UserRole } from '@/types/enums';
import { NextRequest, NextResponse } from 'next/server';

/**
 * Security middleware for Next.js
 * Handles route protection at the middleware level
 */

// Define protected routes and their requirements
export const PROTECTED_ROUTES = {
  // Admin routes
  '/admin': {
    requiredRole: UserRole.ADMIN,
    redirectTo: '/unauthorized',
  },
  
  // User profile routes
  '/profile': {
    requiredRole: UserRole.CUSTOMER,
    redirectTo: '/auth/login',
  },
  
  // Cart routes
  '/cart': {
    requiredRole: UserRole.CUSTOMER,
    redirectTo: '/auth/login',
  },
  
  // Checkout routes
  '/checkout': {
    requiredRole: UserRole.CUSTOMER,
    redirectTo: '/auth/login',
  },
};

// Public routes that don't require authentication
export const PUBLIC_ROUTES = [
  '/',
  '/products',
  '/auth/login',
  '/auth/register',
  '/about',
  '/contact',
];

/**
 * Check if route is public
 */
function isPublicRoute(path: string): boolean {
  return PUBLIC_ROUTES.some(route => {
    if (route === path) return true;
    if (route.endsWith('*')) {
      return path.startsWith(route.slice(0, -1));
    }
    return false;
  });
}

/**
 * Get user role from Supabase session
 */
async function getUserRole(request: NextRequest): Promise<{ role: UserRole | null; userId: string | null }> {
  try {
    const supabase = await createClientServer();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { role: null, userId: null };
    }
    
    const role = user.user_metadata?.role || 
                user.app_metadata?.role || 
                UserRole.CUSTOMER;
    
    return { role, userId: user.id };
  } catch (error) {
    console.error('Error getting user role in middleware:', error);
    return { role: null, userId: null };
  }
}

/**
 * Main middleware function
 */
export async function securityMiddleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next/') ||
    pathname.startsWith('/api/_next/') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon')
  ) {
    return NextResponse.next();
  }
  
  // Handle public routes - allow access without authentication
  if (isPublicRoute(pathname)) {
    return NextResponse.next();
  }
  
  // For protected routes, check authentication
  const protection = PROTECTED_ROUTES[pathname as keyof typeof PROTECTED_ROUTES];
  if (protection) {
    const { role: userRole } = await getUserRole(request);
    
    if (!userRole) {
      const redirectUrl = new URL(protection.redirectTo || '/auth/login', request.url);
      redirectUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(redirectUrl);
    }
  }
  
  // Add security headers
  const response = NextResponse.next();
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  return response;
}

/**
 * Simple rate limiting middleware
 */
export function rateLimitMiddleware(
  request: NextRequest,
  maxRequests: number = 100,
  windowMs: number = 60000 // 1 minute
): NextResponse | null {
  // Simplified rate limiting - in production use Redis
  return null; // Allow all requests for now
}

/**
 * CSRF protection middleware
 */
export function csrfMiddleware(request: NextRequest): NextResponse | null {
  // Skip CSRF for GET, HEAD, OPTIONS requests
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }
  
  return null; // Allow all requests for now
}

/**
 * Middleware configuration for Next.js
 */
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
};