'use client';

import { useUserRole } from '@/hooks/useUserRole';
import { CartNotificationBadge } from './cart-badge';

interface ConditionalCartBadgeProps {
  className?: string;
}

export function ConditionalCartBadge({ className }: ConditionalCartBadgeProps) {
  const { canUseCart, loading } = useUserRole();

  // Ne pas afficher pendant le chargement
  if (loading) {
    return null;
  }

  // Ne pas afficher pour les admins
  if (!canUseCart) {
    return null;
  }

  // Afficher seulement le badge de notification (sans icône de panier)
  return <CartNotificationBadge className={className} />;
}