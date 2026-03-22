import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export type ServerClientMode = 'anon' | 'service_role' | 'readonly';

export async function createClientServer(mode: ServerClientMode = 'anon') {
  const cookieStore = await cookies();

  let supabaseKey: string;
  let setCookies = true;

  switch (mode) {
    case 'service_role':
      supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      if (!supabaseKey) throw new Error('Missing: SUPABASE_SERVICE_ROLE_KEY');
      break;
    case 'readonly':
      supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
      if (!supabaseKey) throw new Error('Missing: SUPABASE_SERVICE_ROLE_KEY');
      setCookies = false;
      break;
    case 'anon':
    default:
      supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
      if (!supabaseKey) throw new Error('Missing: NEXT_PUBLIC_SUPABASE_ANON_KEY');
      break;
  }

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        if (!setCookies) return;
        cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
      },
    },
  });
}

// Legacy exports for backwards compatibility
export const createClientServerReadOnly = () => createClientServer('readonly');
export const createClientServerAnon = () => createClientServer('anon');
export const createClientServerServiceRole = () => createClientServer('service_role');
