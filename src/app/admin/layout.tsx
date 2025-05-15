// src/app/admin/layout.tsx
import Sidebar from './Sidebar'; // Importer depuis le fichier externe
import { SessionProvider } from '@/context/SessionProvider';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';

async function getSession() {
  const supabase = createServerComponentClient({ cookies });
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();

  if (error) {
    console.error('Error fetching server session:', error);
  }
  return session;
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return (
    // min-h-screen assure que le layout prend au moins toute la hauteur de l'écran
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />
      {/* 'main' est sémantiquement correct pour le contenu principal */}
      {/* p-4/6/8 pour le padding, overflow-auto si le contenu dépasse */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        <SessionProvider serverSession={session}>
          {children}
        </SessionProvider>
      </main>
    </div>
  );
}
