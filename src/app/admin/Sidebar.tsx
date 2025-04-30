// src/app/admin/Sidebar.tsx
'use client'; // Nécessaire pour utiliser usePathname

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils'; // Assurez-vous d'avoir cette fonction utilitaire

// --- Icônes (exemple avec lucide-react) ---
// Installez lucide-react: npm install lucide-react
import {
  LayoutDashboard,
  Users,
  Tags, // Icône pour catégories
  Package, // Icône pour produits
  ShoppingCart, // Icône pour commandes
} from 'lucide-react';

// Structure des liens pour faciliter la maintenance
const menuItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/customers', label: 'Customers', icon: Users }, // Ajustez le href si différent
  { href: '/admin/categories', label: 'Categories', icon: Tags },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart }, // Ajout d'un lien pour les commandes
];

const Sidebar = () => {
  const pathname = usePathname(); // Pour savoir quelle page est active

  return (
    // flex-shrink-0 empêche la sidebar de rétrécir
    <aside className="w-64 bg-gray-800 text-gray-100 p-4 flex flex-col flex-shrink-0">
      <div className="mb-8 text-center">
         {/* Optionnel: Ajouter un logo ou titre plus stylisé */}
         <Link href="/admin" className="text-2xl font-semibold text-white">Admin Panel</Link>
      </div>
      <nav className="flex-grow"> {/* flex-grow pour pousser les éventuels éléments du bas */}
        <ul>
          {menuItems.map((item) => (
            <li key={item.href} className="mb-2">
              <Link
                href={item.href}
                className={cn(
                  'flex items-center p-3 rounded-lg text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200',
                  {
                    'bg-blue-600 text-white font-semibold shadow-md': pathname === item.href, // Style du lien actif
                  }
                )}
              >
                <item.icon className="mr-3 h-5 w-5 flex-shrink-0" aria-hidden="true" />
                <span>{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
      {/* Vous pouvez ajouter un pied de page à la sidebar ici (ex: lien déconnexion) */}
      {/* <div className="mt-auto"> ... Logout Button ... </div> */}
    </aside>
  );
};

export default Sidebar;
