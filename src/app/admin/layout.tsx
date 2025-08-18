// src/app/admin/layout.tsx
import Sidebar from './Sidebar'; // Importer depuis le fichier externe

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    // AdminSessionProvider is now handled by ConditionalProviders in root layout
    // The admin header is now handled by the root layout's ConditionalHeader
    // This layout only handles the sidebar and main content area
    <div className="flex flex-1 bg-gray-100">
      <Sidebar />
      {/* 'main' est sémantiquement correct pour le contenu principal */}
      {/* p-4/6/8 pour le padding, overflow-auto si le contenu dépasse */}
      <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-auto">
        {children}
      </main>
    </div>
  );
}
