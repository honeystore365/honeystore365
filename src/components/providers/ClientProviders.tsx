'use client';

import { CartProvider } from '@/context/CartProvider';
import { ReactNode } from 'react';

interface ClientProvidersProps {
  children: ReactNode;
}

export function ClientProviders({ children }: ClientProvidersProps) {
  return <CartProvider>{children}</CartProvider>;
}
