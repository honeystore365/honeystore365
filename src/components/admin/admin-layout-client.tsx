'use client';

import { useEffect } from 'react';

interface AdminLayoutClientProps {
  children: React.ReactNode;
}

export function AdminLayoutClient({ children }: AdminLayoutClientProps) {
  // Masquer le header client sur les pages admin
  useEffect(() => {
    const siteHeader = document.querySelector('.site-header');
    if (siteHeader) {
      (siteHeader as HTMLElement).style.display = 'none';
    }
    document.body.setAttribute('data-admin-page', 'true');

    return () => {
      const siteHeader = document.querySelector('.site-header');
      if (siteHeader) {
        (siteHeader as HTMLElement).style.display = '';
      }
      document.body.removeAttribute('data-admin-page');
    };
  }, []);

  return <>{children}</>;
}
