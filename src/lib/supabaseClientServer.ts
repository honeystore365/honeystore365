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
        get: (name: string) => {
          return cookieStore.get(name)?.value;
        },
        set: (name: string, value: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            console.error('Error setting cookie:', error);
          }
        },
        remove: (name: string, options: CookieOptions) => {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            console.error('Error removing cookie:', error);
          }
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
};
