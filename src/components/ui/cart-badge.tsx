'use client';

import { useCart } from '@/context/CartProvider';
import { ShoppingCart } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface CartBadgeProps {
  className?: string;
  showText?: boolean;
}

interface CartBadgeContentProps {
  className?: string;
  showText?: boolean;
}

// Component for just the badge content without link wrapper
export function CartBadgeContent({ className = '', showText = false }: CartBadgeContentProps) {
  const { cartItemCount } = useCart();

  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(cartItemCount);

  // Animation quand le nombre change
  useEffect(() => {
    if (cartItemCount !== prevCount && cartItemCount > prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
    setPrevCount(cartItemCount);
  }, [cartItemCount, prevCount]);

  return (
    <div className={`relative inline-flex items-center gap-2 ${className}`}>
      <div className='relative'>
        <ShoppingCart
          className={`h-6 w-6 transition-transform duration-200 ${isAnimating ? 'scale-110' : 'scale-100'}`}
        />

        {/* Badge avec le nombre d'articles */}
        {cartItemCount > 0 && (
          <span
            className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transition-all duration-300 ${
              isAnimating ? 'scale-125 bg-red-600' : 'scale-100'
            }`}
            style={{
              minWidth: cartItemCount > 99 ? '1.5rem' : '1.25rem',
              fontSize: cartItemCount > 99 ? '0.6rem' : '0.75rem',
            }}
          >
            {cartItemCount > 99 ? '99+' : cartItemCount}
          </span>
        )}

        {/* Animation de pulsation pour les nouveaux articles */}
        {isAnimating && (
          <span className='absolute -top-2 -right-2 bg-red-500 rounded-full h-5 w-5 animate-ping opacity-75' />
        )}
      </div>

      {showText && <span className='text-sm font-medium'>السلة {cartItemCount > 0 && `(${cartItemCount})`}</span>}
    </div>
  );
}

// Component for just the notification badge without the cart icon
export function CartNotificationBadge({ className = '' }: { className?: string }) {
  const { cartItemCount } = useCart();

  const [isAnimating, setIsAnimating] = useState(false);
  const [prevCount, setPrevCount] = useState(cartItemCount);

  // Animation quand le nombre change
  useEffect(() => {
    if (cartItemCount !== prevCount && cartItemCount > prevCount) {
      setIsAnimating(true);
      const timer = setTimeout(() => {
        setIsAnimating(false);
      }, 600); // Longer animation
      return () => clearTimeout(timer);
    }
    setPrevCount(cartItemCount);
  }, [cartItemCount, prevCount]);

  // Only show if there are items in cart
  if (cartItemCount === 0) {
    return null;
  }

  return (
    <>
      {/* Badge avec le nombre d'articles */}
      <span
        className={`absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transition-all duration-500 ${
          isAnimating ? 'scale-150 bg-red-600 shadow-lg' : 'scale-100'
        } ${className}`}
        style={{
          minWidth: cartItemCount > 99 ? '1.5rem' : '1.25rem',
          fontSize: cartItemCount > 99 ? '0.6rem' : '0.75rem',
        }}
      >
        {cartItemCount > 99 ? '99+' : cartItemCount}
      </span>

      {/* Animation de pulsation pour les nouveaux articles */}
      {isAnimating && (
        <span className='absolute -top-2 -right-2 bg-red-500 rounded-full h-5 w-5 animate-ping opacity-75' />
      )}
    </>
  );
}

// Component with link wrapper for standalone use
export function CartBadge({ className = '', showText = false }: CartBadgeProps) {
  return (
    <Link
      href='/cart'
      className={`relative inline-flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 transition-colors ${className}`}
    >
      <CartBadgeContent showText={showText} />
    </Link>
  );
}

export default CartBadge;
