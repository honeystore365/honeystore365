<<<<<<< HEAD
import { Sidebar } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <SiteHeader />
        <main className="flex-1 p-4">
          {children}
        </main>
      </div>
    </div>
  )
}
=======
>>>>>>> 2a562a4f2045fa117c49bb1a553cc5d615bd8e29
