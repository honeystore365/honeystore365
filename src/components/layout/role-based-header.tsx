'use client';

import Link from 'next/link';
import { useUserRole } from '@/hooks/useUserRole';
import { ConditionalCartBadge } from '@/components/ui/conditional-cart-badge';
import { Button } from '@/components/ui/button';
import { 
  User, 
  Settings, 
  LogOut, 
  ShoppingBag, 
  Package, 
  Users, 
  BarChart3,
  Home
} from 'lucide-react';

export function RoleBasedHeader() {
  const { userContext, capabilities, loading, isAdmin, isCustomer } = useUserRole();

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-8 w-48 rounded"></div>
          </div>
        </div>
      </header>
    );
  }

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="text-2xl">🍯</div>
              <span className="text-xl font-bold text-amber-600">
                {isAdmin ? 'HoneyStore Admin' : 'مناحل الرحيق'}
              </span>
            </Link>
          </div>

          {/* Navigation centrale */}
          <nav className="hidden md:flex items-center space-x-8">
            {/* Navigation pour les clients */}
            {capabilities?.showCustomerNavigation && (
              <>
                <Link href="/" className="text-gray-700 hover:text-amber-600 flex items-center">
                  <Home className="w-4 h-4 mr-1" />
                  الرئيسية
                </Link>
                <Link href="/products" className="text-gray-700 hover:text-amber-600 flex items-center">
                  <ShoppingBag className="w-4 h-4 mr-1" />
                  المنتجات
                </Link>
                {isCustomer && (
                  <Link href="/orders" className="text-gray-700 hover:text-amber-600">
                    طلباتي
                  </Link>
                )}
              </>
            )}

            {/* Navigation pour l'admin */}
            {capabilities?.showAdminNavigation && (
              <>
                <Link href="/admin" className="text-gray-700 hover:text-blue-600 flex items-center">
                  <BarChart3 className="w-4 h-4 mr-1" />
                  Dashboard
                </Link>
                <Link href="/admin/products" className="text-gray-700 hover:text-blue-600 flex items-center">
                  <Package className="w-4 h-4 mr-1" />
                  Products
                </Link>
                <Link href="/admin/customers" className="text-gray-700 hover:text-blue-600 flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  Customers
                </Link>
                <Link href="/admin/orders" className="text-gray-700 hover:text-blue-600">
                  Orders
                </Link>
              </>
            )}
          </nav>

          {/* Actions à droite */}
          <div className="flex items-center space-x-4">
            {/* Badge panier (seulement pour les clients) */}
            {capabilities?.showCartBadge && (
              <ConditionalCartBadge />
            )}

            {/* Menu utilisateur */}
            <div className="flex items-center space-x-2">
              {userContext?.email ? (
                <div className="flex items-center space-x-2">
                  {/* Profil utilisateur */}
                  <div className="flex items-center space-x-2">
                    <User className="w-5 h-5 text-gray-600" />
                    <span className="text-sm text-gray-700">
                      {isAdmin ? 'Admin' : 'العميل'}
                    </span>
                  </div>

                  {/* Paramètres */}
                  {isAdmin ? (
                    <Link href="/admin/settings">
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </Link>
                  ) : (
                    <Link href="/profile">
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </Link>
                  )}

                  {/* Déconnexion */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      // Logique de déconnexion
                      window.location.href = '/auth/logout';
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center space-x-2">
                  <Link href="/auth/login">
                    <Button variant="outline" size="sm">
                      تسجيل الدخول
                    </Button>
                  </Link>
                  <Link href="/auth/register">
                    <Button size="sm">
                      إنشاء حساب
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur de rôle (développement) */}
      {process.env.NODE_ENV === 'development' && userContext && (
        <div className="bg-gray-100 px-4 py-1 text-xs text-center">
          Mode: {userContext.role} | Email: {userContext.email} | 
          Panier: {userContext.canUseCart ? 'Activé' : 'Désactivé'}
        </div>
      )}
    </header>
  );
}