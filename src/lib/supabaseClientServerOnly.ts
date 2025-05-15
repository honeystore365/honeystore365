import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

import { Database } from '@/types/supabase';

export const createClientServerOnly = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_URL');
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseKey,
    {
      db: {
        schema: 'public',
      },
      cookies: {
        get: async (name: string) => {
          return (await cookies()).get(name)?.value;
        },
        set: async (name: string, value: string, options: any) => {
          (await cookies()).set(name, value, options);
        },
        remove: async (name: string, options: any) => {
          (await cookies()).delete(name);
        },
      },
      auth: {
        autoRefreshToken: false, // Service role key doesn't need refresh
        persistSession: false, // No session to persist with service role key
        detectSessionInUrl: false // Not applicable server-side
      },
    }
  );
};
