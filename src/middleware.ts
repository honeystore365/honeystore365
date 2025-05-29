import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });
 
  try {
    console.log('[Middleware] Starting middleware execution.');
    // Vérifier que les variables d'environnement sont présentes
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables');
      console.log(`NEXT_PUBLIC_SUPABASE_URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Present' : 'Missing'}`);
      console.log(`NEXT_PUBLIC_SUPABASE_ANON_KEY: ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Present' : 'Missing'}`);
      return supabaseResponse; // Return the initialized response
    }
    console.log('Supabase environment variables are present.');

  // Temporarily removed Supabase client initialization and authentication logic
  // to isolate if the crash is happening before or during this part.
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