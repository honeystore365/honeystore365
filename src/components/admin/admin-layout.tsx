'use client';

import { useSession } from '@/context/SessionProvider';
import { Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AdminHeader } from './admin-header';

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const { session, loading } = useSession();
  const router = useRouter();

  // Vérifier si l'utilisateur est admin
  useEffect(() => {
    if (!loading && session) {
      const user = session.user;
      const userRole = user.user_metadata?.role || user.app_metadata?.role;

      if (userRole !== 'admin') {
        // Rediriger vers la page d'accueil si pas admin
        router.push('/');
        return;
      }
    } else if (!loading && !session) {
      // Rediriger vers login si pas connecté
      router.push('/auth/login');
      return;
    }
  }, [session, loading, router]);

  // Afficher un loader pendant la vérification
  if (loading) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-blue-600' />
          <p className='text-gray-600'>جاري التحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  // Vérifier les permissions admin
  if (session) {
    const user = session.user;
    const userRole = user.user_metadata?.role || user.app_metadata?.role;

    if (userRole !== 'admin') {
      return (
        <div className='min-h-screen flex items-center justify-center bg-gray-50'>
          <div className='text-center max-w-md mx-auto p-6'>
            <div className='bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4'>
              <span className='text-red-600 text-2xl'>⚠️</span>
            </div>
            <h1 className='text-xl font-bold text-gray-900 mb-2'>غير مصرح لك بالوصول</h1>
            <p className='text-gray-600 mb-4'>هذه الصفحة مخصصة للمديرين فقط</p>
            <button
              onClick={() => router.push('/')}
              className='bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors'
            >
              العودة للصفحة الرئيسية
            </button>
          </div>
        </div>
      );
    }
  }

  if (!session) {
    return (
      <div className='min-h-screen flex items-center justify-center bg-gray-50'>
        <div className='text-center'>
          <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-blue-600' />
          <p className='text-gray-600'>جاري إعادة التوجيه...</p>
        </div>
      </div>
    );
  }

  return (
    <div className='min-h-screen bg-gray-50'>
      <AdminHeader />
      <main className='flex-1'>{children}</main>
    </div>
  );
}
