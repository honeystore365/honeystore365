'use client';

import { useUserRole } from '@/hooks/useUserRole';
import { AddToCartButton } from './add-to-cart-button';

interface ConditionalAddToCartProps {
  productId: string;
  quantity?: number;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
}

export function ConditionalAddToCart({ 
  productId, 
  quantity = 1, 
  variant = 'default',
  size = 'md',
  className,
  disabled 
}: ConditionalAddToCartProps) {
  const { canUseCart, loading, isAdmin } = useUserRole();

  // Ne pas afficher pendant le chargement
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 h-10 w-32 rounded"></div>
    );
  }

  // Pour les admins, afficher un message informatif
  if (isAdmin) {
    return (
      <div className="text-sm text-gray-500 italic p-2 bg-gray-50 rounded">
        Mode administrateur - Panier désactivé
      </div>
    );
  }

  // Ne pas afficher si l'utilisateur ne peut pas utiliser le panier
  if (!canUseCart) {
    return null;
  }

  // Afficher le bouton normal pour les clients et invités
  const mappedSize = size === 'md' ? 'default' : size;
  
  return (
    <AddToCartButton
      productId={productId}
      productName="Product" // TODO: Pass actual product name
      variant={variant}
      size={mappedSize}
      className={className}
    />
  );
}