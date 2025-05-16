import { updateSession } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function middleware(request: NextRequest) {
  // Update the session and get the modified response
  const response = await updateSession(request)

  try {
    // Create a Supabase client (assuming updateSession makes cookies available)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      // No cookies object here
    )

    // Now get the user using the client
    const {
      data: { user },
    } = await supabase.auth.getUser()

    const role =
      user?.user_metadata?.role || user?.app_metadata?.role

    if (!user || role !== 'admin') {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      if (request.nextUrl.pathname.startsWith('/admin')) {
        return NextResponse.redirect(url)
      }
    }

    return response
  } catch (err) {
    console.error("Middleware error:", err)
    return new NextResponse("Internal middleware error", { status: 500 })
  }
}
