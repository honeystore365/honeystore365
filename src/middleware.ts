import { NextResponse, type NextRequest } from 'next/server';
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export async function middleware(request: NextRequest) {
  // Create an outgoing response object that we can modify or pass to Supabase.
  // This response object will be used by the Supabase client to set cookies.
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Create a Supabase client configured to use cookies.
  // This client will read cookies from the request and can write them to the response.
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value;
        },
        set(name: string, value: string, options: CookieOptions) {
          // The Supabase client will call this method to set cookies.
          // We need to set the cookie on the response object.
          response.cookies.set({
            name,
            value,
            ...options,
          });
        },
        remove(name: string, options: CookieOptions) {
          // The Supabase client will call this method to remove cookies.
          // We need to delete the cookie on the response object.
          response.cookies.set({
            name,
            value: '', // Setting an empty value and maxAge 0 or expires past date effectively deletes it
            ...options,
            maxAge: 0, // Or use `response.cookies.delete({ name, ...options })` if available and preferred
          });
        },
      },
    }
  );

  try {
    // Attempt to get the user. This will also refresh the session if necessary.
    // The cookie handling within createServerClient (the set/remove methods above)
    // will be called if the session is refreshed, updating the `response` object.
    const {
      data: { user },
    } = await supabase.auth.getUser(); // This is the correct method for @supabase/ssr

    // Perform role check and redirect if necessary
    // Adjusted role check to look into user_metadata and app_metadata as before
    const role = user?.user_metadata?.role || user?.app_metadata?.role;


    if (!user || role !== 'admin') {
      const url = request.nextUrl.clone();
      url.pathname = '/auth/login';
      // Only redirect if trying to access admin pages
      if (request.nextUrl.pathname.startsWith('/admin')) {
        // Return a new redirect response
        return NextResponse.redirect(url);
      }
    }

    // Return the response. If Supabase needed to update cookies (e.g., session refresh),
    // those cookies would have been set on this 'response' object by the 'set'/'remove' methods.
    return response;

  } catch (err) {
    console.error('Middleware error:', err);
    // It's important to return a response in case of error
    return new NextResponse('Internal middleware error', { status: 500 });
  }
}
