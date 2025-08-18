'use client';

import { Button } from '@/components/ui/button';
import { ProfileCompletionStatus } from '@/lib/utils/profile-validation';
import { ShoppingCart, User } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

interface OrderValidationWrapperProps {
  children: ReactNode;
  profileStatus: ProfileCompletionStatus;
  fallbackText?: string;
}

export function OrderValidationWrapper({
  children,
  profileStatus,
  fallbackText = 'أكمل ملفك الشخصي للطلب',
}: OrderValidationWrapperProps) {
  // If profile is complete, render the original children (add to cart button)
  if (profileStatus.canPlaceOrder) {
    return <>{children}</>;
  }

  // If profile is incomplete, show completion button instead
  return (
    <Link href='/profile/edit'>
      <Button
        variant='outline'
        size='lg'
        className='bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100 rounded-full group'
        disabled={false}
      >
        <User className='h-5 w-5 mr-2 group-hover:scale-110 transition-transform' />
        {fallbackText}
      </Button>
    </Link>
  );
}

interface CartActionButtonProps {
  profileStatus: ProfileCompletionStatus;
  onAddToCart: () => void;
  isLoading?: boolean;
  productName?: string;
}

export function CartActionButton({
  profileStatus,
  onAddToCart,
  isLoading = false,
  productName = 'المنتج',
}: CartActionButtonProps) {
  if (!profileStatus.canPlaceOrder) {
    return (
      <Link href='/profile/edit'>
        <Button
          variant='outline'
          size='lg'
          className='bg-yellow-50 border-yellow-300 text-yellow-800 hover:bg-yellow-100 rounded-full group w-full'
        >
          <User className='h-5 w-5 mr-2 group-hover:scale-110 transition-transform' />
          أكمل ملفك الشخصي للطلب
        </Button>
      </Link>
    );
  }

  return (
    <Button
      variant='default'
      size='lg'
      className='bg-honey hover:bg-honey-dark text-white rounded-full group w-full'
      onClick={onAddToCart}
      disabled={isLoading}
    >
      <ShoppingCart className='h-5 w-5 mr-2 group-hover:scale-110 transition-transform' />
      {isLoading ? 'جاري الإضافة...' : 'أضف إلى السلة'}
    </Button>
  );
}
