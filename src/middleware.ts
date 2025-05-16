import { createMiddlewareClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  try {
    const response = NextResponse.next()

    const supabase = createMiddlewareClient({ req: request, res: response })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    const userRole =
      user?.user_metadata?.role ||
      user?.app_metadata?.role

    if (!user || userRole !== 'admin') {
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
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(svg|png|jpg|jpeg|gif|webp)).*)',
    '/admin/:path*',
    '/auth/login',
    '/auth/register',
  ],
}
