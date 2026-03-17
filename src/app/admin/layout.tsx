"use client";

import { db } from "@/lib/db";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Package, ShoppingCart, Users, Tag, LayoutDashboard, LogOut } from "lucide-react";

function AdminSidebar() {
  const pathname = usePathname();
  const { user, isLoading } = db.useAuth();

  const navItems = [
    { href: "/admin", icon: LayoutDashboard, label: "Dashboard" },
    { href: "/admin/products", icon: Package, label: "Produits" },
    { href: "/admin/orders", icon: ShoppingCart, label: "Commandes" },
    { href: "/admin/categories", icon: Tag, label: "Catégories" },
  ];

  if (isLoading) return null;

  return (
    <aside className="w-64 bg-white border-r border-gray-200 min-h-screen fixed right-0 top-0">
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-amber-600">🍯 HoneyStore</h1>
        <p className="text-xs text-gray-500 mt-1">Administration</p>
      </div>

      <nav className="p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                isActive
                  ? "bg-amber-50 text-amber-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="absolute bottom-0 right-0 left-0 p-4 border-t border-gray-200">
        <div className="flex items-center gap-3 px-4 py-3">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
            <Users className="w-4 h-4 text-amber-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">{user?.email}</p>
            <p className="text-xs text-gray-500">Administrateur</p>
          </div>
        </div>
        <button
          onClick={() => db.auth.signOut()}
          className="flex items-center gap-3 px-4 py-3 w-full text-red-600 hover:bg-red-50 rounded-lg transition-colors mt-2"
        >
          <LogOut className="w-5 h-5" />
          <span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = db.useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold mb-4">🔒 Connexion Admin</h1>
          <p className="text-gray-600 mb-6">
            Veuillez vous connecter pour accéder au dashboard.
          </p>
          <button
            onClick={() => db.auth.signInWithMagicCode({ email: "" })}
            className="w-full bg-amber-600 text-white py-3 rounded-lg hover:bg-amber-700 transition-colors"
          >
            Se connecter avec Magic Code
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminSidebar />
      <main className="mr-64 p-8 min-h-screen">
        {children}
      </main>
    </div>
  );
}
