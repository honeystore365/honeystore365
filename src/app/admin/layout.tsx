// src/app/admin/layout.tsx
import Sidebar from './Sidebar'; // Importer depuis le fichier externe
import { SessionProvider } from '@/context/SessionProvider';
// import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'; // REMOVE THIS
import { createServerClient, CookieOptions } from '@supabase/ssr'; // Import createServerClient and CookieOptions from @supabase/ssr
import { cookies } from 'next/headers';

import { Session } from '@supabase/supabase-js'; // Import Session type

async function getUserAndSession() {
  const cookieStore = await cookies(); // AWAIT cookies() here

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options);
            });
          } catch (e) {
            // This catch block is for the "setAll" method being called from a Server Component
            // which is a known behavior if you have middleware refreshing user sessions.
            // It can be ignored.
            console.warn('Error setting cookies in Server Component:', e);
          }
        },
      },
      cookieEncoding: 'base64url', // Explicitly set cookieEncoding here
    }
  );

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error('Error fetching server user:', userError);
  }
  if (sessionError) {
    console.error('Error fetching server session:', sessionError);
  }

  return { user, session };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, session } = await getUserAndSession(); // Destructure both

  return (
    // min-h-screen assure que le layout prend au moins toute la hauteur de l'écran
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      {/* 'main' est sémantiquement correct pour le contenu principal */}
      {/* p-4/6/8 pour le padding, overflow-auto si le contenu dépasse */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <SessionProvider serverUser={user} serverSession={session}> {/* Pass both */}
          {children}
        </SessionProvider>
      </main>
    </div>
  );
}
