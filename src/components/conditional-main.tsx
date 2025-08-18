'use client';

import { usePathname } from 'next/navigation';

interface ConditionalMainProps {
  children: React.ReactNode;
}

export function ConditionalMain({ children }: ConditionalMainProps) {
  const pathname = usePathname();
  
  // Check if we're on an admin route
  const isAdminRoute = pathname.startsWith('/admin');
  
  // For admin routes, don't add padding since the admin layout handles it
  if (isAdminRoute) {
    return <>{children}</>;
  }
  
  // For client routes, add the standard padding
  return (
    <main className="flex-1 py-8 w-full !max-w-none">
      {children}
    </main>
  );
}