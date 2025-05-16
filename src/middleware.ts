import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  try {
    const supabase = createMiddlewareClient({ req: request, res: response })

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

export const config = {
  matcher: ['/admin/:path*'], // Ajoute d'autres routes à sécuriser ici
}
