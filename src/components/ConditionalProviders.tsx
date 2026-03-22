'use client';

import { usePathname } from 'next/navigation';
import { AdminSessionProvider } from '@/context/AdminSessionProvider';
import { CartProvider } from '@/context/CartProvider';

interface ConditionalProvidersProps {
  children: React.ReactNode;
}

export function ConditionalProviders({ children }: ConditionalProvidersProps) {
  const pathname = usePathname();
  
  // Check if we're on an admin route
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Wrap with AdminSessionProvider for admin routes
  if (isAdminRoute) {
    return (
      <AdminSessionProvider>
        {children}
      </AdminSessionProvider>
    );
  }
  
  // Wrap with CartProvider for client routes
  return (
    <CartProvider>
      {children}
    </CartProvider>
  );
}