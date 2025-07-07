'use client';

import { createBrowserClient } from '@supabase/ssr';

export const createClientComponent = () => createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      flowType: 'pkce',
      detectSessionInUrl: true,
      persistSession: true,
      autoRefreshToken: true,
    },
    cookies: {
      get(name: string) {
        const cookie = document.cookie
          .split('; ')
          .find((row) => row.startsWith(`${name}=`))
          ?.split('=')[1];
        return cookie ? decodeURIComponent(cookie) : undefined;
      },
      set(name: string, value: string, options: any) {
        document.cookie = `${name}=${encodeURIComponent(value)}; ${Object.entries(options)
          .map(([key, val]) => `${key}=${val}`)
          .join('; ')}`;
      },
      remove(name: string, options: any) {
        document.cookie = `${name}=; Path=${options.path || '/'}; Expires=Thu, 01 Jan 1970 00:00:00 GMT; ${options.domain ? `Domain=${options.domain};` : ''}${options.secure ? ' Secure;' : ''}`;
      }
    },
    cookieOptions: {
      name: 'sb-llsifflkfjogjagmbmpi-auth-token',
      domain: process.env.NODE_ENV === 'production' ? '.nectar-hives.com' : undefined,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 3600, // 1 hour
    }
  }
);
