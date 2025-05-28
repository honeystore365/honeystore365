import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';

type KeyType = 'anon' | 'service_role';

export const createClientServer = async (keyType: KeyType = 'anon') => {
  const cookieStore = await cookies();
  const supabaseKey = keyType === 'service_role'
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  if (!supabaseKey) {
    throw new Error(`Missing environment variable: ${keyType === 'service_role' ? 'SUPABASE_SERVICE_ROLE_KEY' : 'NEXT_PUBLIC_SUPABASE_ANON_KEY'}`);
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
      cookieEncoding: 'base64url', // Use 'base64url' encoding for Supabase session cookies
      cookieOptions: {
        // You can add default cookie options here if needed
        // For example:
        // secure: process.env.NODE_ENV === 'production',
        // sameSite: 'lax',
      },
    }
  );
};