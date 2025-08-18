'use client';

import { Button } from '@/components/ui/button';
import { useAdminSession } from '@/context/AdminSessionProvider';
import { cn } from '@/lib/utils';
import { LayoutDashboard, LogOut, Menu, Package, Settings, ShoppingBag, Users, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const LOGO_URL = '/favicon.png';
const LOGO_ALT = 'مناحل الرحيق Logo';
const COMPANY_NAME = 'مناحل الرحيق';

// Navigation links spécifiques à l'admin
const adminNavigationLinks = [
  {
    href: '/admin',
    label: 'لوحة الإدارة',
    icon: <LayoutDashboard className='h-4 w-4' />,
    description: 'Dashboard principal',
  },
  {
    href: '/admin/orders',
    label: 'إدارة الطلبات',
    icon: <ShoppingBag className='h-4 w-4' />,
    description: 'Gestion des commandes',
  },
  {
    href: '/admin/products',
    label: 'إدارة المنتجات',
    icon: <Package className='h-4 w-4' />,
    description: 'Gestion des produits',
  },
  {
    href: '/admin/customers',
    label: 'إدارة العملاء',
    icon: <Users className='h-4 w-4' />,
    description: 'Gestion des clients',
  },
  {
    href: '/admin/settings',
    label: 'الإعدادات',
    icon: <Settings className='h-4 w-4' />,
    description: 'Paramètres système',
  },
];

export function AdminHeader() {
  const { adminSession, signOutAdmin } = useAdminSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const router = useRouter();

  const handleSignOut = async () => {
    await signOutAdmin();
    router.push('/');
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className='sticky top-0 z-50 w-full border-b border-gray-200 bg-white shadow-sm'>
      <div className='flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8'>
        {/* Logo et titre admin */}
        <div className='flex items-center gap-4'>
          <Link href='/admin' className='flex items-center gap-3'>
            <Image
              src={LOGO_URL}
              alt={LOGO_ALT}
              width={40}
              height={40}
              priority
              className='h-10 w-10 rounded-md object-contain'
            />
            <div className='hidden sm:block'>
              <h1 className='text-lg font-bold text-gray-900'>{COMPANY_NAME}</h1>
              <p className='text-xs text-gray-500'>لوحة الإدارة</p>
            </div>
          </Link>
        </div>

        {/* Navigation desktop */}
        <nav className='hidden md:flex items-center space-x-6'>
          {adminNavigationLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-md transition-colors',
                'text-gray-700 hover:text-blue-600 hover:bg-blue-50',
                'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
              )}
              title={link.description}
            >
              <span className='text-blue-600'>{link.icon}</span>
              <span>{link.label}</span>
            </Link>
          ))}
        </nav>

        {/* Actions utilisateur */}
        <div className='flex items-center gap-3'>
          {/* Informations admin */}
          <div className='hidden md:flex items-center gap-3'>
            <div className='text-right'>
              <p className='text-sm font-medium text-gray-900'>{adminSession?.user?.first_name || 'المدير'}</p>
              <p className='text-xs text-gray-500'>مدير النظام</p>
            </div>

            {/* Bouton déconnexion */}
            <Button
              variant='outline'
              size='sm'
              onClick={handleSignOut}
              className='border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300'
            >
              <LogOut className='h-4 w-4 mr-2' />
              خروج
            </Button>
          </div>

          {/* Menu mobile */}
          <Button
            variant='ghost'
            size='sm'
            className='md:hidden'
            onClick={toggleMobileMenu}
            aria-label={mobileMenuOpen ? 'إغلاق القائمة' : 'فتح القائمة'}
          >
            {mobileMenuOpen ? <X className='h-5 w-5' /> : <Menu className='h-5 w-5' />}
          </Button>
        </div>
      </div>

      {/* Menu mobile */}
      {mobileMenuOpen && (
        <div className='md:hidden border-t border-gray-200 bg-white shadow-lg'>
          <div className='px-4 py-3 space-y-2'>
            {/* Navigation mobile */}
            <nav className='space-y-1'>
              {adminNavigationLinks.map(link => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 text-sm font-medium rounded-md transition-colors',
                    'text-gray-700 hover:text-blue-600 hover:bg-blue-50'
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className='text-blue-600'>{link.icon}</span>
                  <div>
                    <div>{link.label}</div>
                    <div className='text-xs text-gray-500'>{link.description}</div>
                  </div>
                </Link>
              ))}
            </nav>

            {/* Séparateur */}
            <div className='border-t border-gray-200 pt-3 mt-3'>
              {/* Info utilisateur mobile */}
              <div className='flex items-center gap-3 px-3 py-2 mb-3'>
                <div className='flex-1'>
                  <p className='text-sm font-medium text-gray-900'>{adminSession?.user?.first_name || 'المدير'}</p>
                  <p className='text-xs text-gray-500'>مدير النظام</p>
                </div>
              </div>

              {/* Bouton déconnexion mobile */}
              <Button
                variant='outline'
                className='w-full border-red-200 text-red-600 hover:bg-red-50'
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
              >
                <LogOut className='h-4 w-4 mr-2' />
                تسجيل الخروج
              </Button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
