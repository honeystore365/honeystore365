import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function updateSession(request: NextRequest) {
  // Create a Supabase client configured to use cookies
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        storageKey: 'sb',
        detectSessionInUrl: true,
        flowType: 'pkce',
        autoRefreshToken: true,
        persistSession: true,
      },
      global: {
        headers: { 'x-client-info': 'SUPABASE_SDK/integration/nextjs' },
      },
    }
  )

  // Refresh the session if it's expired and set the new cookies
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  if (session) {
    response.cookies.set({
      name: 'sb-access-token',
      value: session.access_token,
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
    })
    response.cookies.set({
      name: 'sb-refresh-token',
      value: session.refresh_token!,
      httpOnly: true,
      secure: true,
      path: '/',
      sameSite: 'lax',
    })
  } else {
    response.cookies.delete('sb-access-token')
    response.cookies.delete('sb-refresh-token')
  }

  return response
}


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
