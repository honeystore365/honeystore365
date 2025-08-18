'use client';

import { usePathname } from 'next/navigation';
import { SiteHeader } from '@/components/site-header';
import { AdminHeader } from '@/components/admin/admin-header';

export function ConditionalHeader() {
  const pathname = usePathname();
  
  // Check if we're on an admin route
  const isAdminRoute = pathname.startsWith('/admin');
  
  // Don't render any header for admin login page
  if (pathname === '/admin/login') {
    return null;
  }
  
  // Render admin header for admin routes
  if (isAdminRoute) {
    return <AdminHeader />;
  }
  
  // Render site header for all other routes
  return <SiteHeader />;
}