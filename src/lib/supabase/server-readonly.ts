import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export const createClientServerReadOnly = async () => {
  const cookieStore = await cookies();

  return createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll() {
        // Do nothing, as cookies cannot be set in a Server Component directly.
        // Session refreshing for Server Components should be handled via Server Actions.
      },
    },
  });
};
