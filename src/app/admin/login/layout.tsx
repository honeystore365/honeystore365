/**
 * Layout spécial pour la page de login admin
 * Complètement isolé du reste de l'application
 */

import { Toaster } from '@/components/ui/toaster';
import type { Metadata } from 'next';
import '../../globals.css';

export const metadata: Metadata = {
  title: 'تسجيل دخول المدير - مناحل الرحيق',
  description: 'صفحة تسجيل دخول مديري متجر مناحل الرحيق',
  robots: 'noindex, nofollow', // Empêcher l'indexation
};

export default function AdminLoginLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className='admin-login-layout'>
      {children}
      <Toaster />
    </div>
  );
}
