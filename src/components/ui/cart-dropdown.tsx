'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCart } from '@/context/CartProvider';
import { Eye, ShoppingCart, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { OptimizedImage } from './optimized-image';

interface CartDropdownProps {
  className?: string;
}

export function CartDropdown({ className = '' }: CartDropdownProps) {
  const { cart, cartItemCount, removeFromCart } = useCart();

  const handleRemoveItem = async (itemId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await removeFromCart(itemId);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className={`relative p-2 ${className}`}>
          <ShoppingCart className='h-6 w-6' />
          {cartItemCount > 0 && (
            <span className='absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center'>
              {cartItemCount > 99 ? '99+' : cartItemCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-80 max-h-96 overflow-y-auto'>
        {cartItemCount === 0 ? (
          <div className='p-4 text-center text-gray-500'>
            <ShoppingCart className='h-12 w-12 mx-auto mb-2 text-gray-300' />
            <p>السلة فارغة</p>
            <p className='text-sm'>أضف بعض المنتجات لتبدأ التسوق</p>
          </div>
        ) : (
          <>
            <div className='p-2'>
              <h3 className='font-semibold text-sm mb-2'>سلة التسوق ({cartItemCount} منتج)</h3>

              {cart?.items?.slice(0, 3).map(item => (
                <div key={item.id} className='flex items-center gap-3 p-2 hover:bg-gray-50 rounded'>
                  {/* صورة المنتج */}
                  <div className='relative w-12 h-12 flex-shrink-0'>
                    <OptimizedImage
                      src={item.product?.imageUrl || (item.product as any)?.image_url || '/images/placeholder.svg'}
                      alt={item.product?.name || 'منتج'}
                      fill
                      className='rounded object-cover'
                    />
                  </div>

                  {/* تفاصيل المنتج */}
                  <div className='flex-1 min-w-0'>
                    <p className='text-sm font-medium truncate'>{item.product?.name || 'منتج غير معروف'}</p>
                    <p className='text-xs text-gray-500'>
                      {item.quantity} × {item.product?.price || 0} د.ت
                    </p>
                  </div>

                  {/* زر الحذف */}
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50'
                    onClick={e => handleRemoveItem(item.id, e)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}

              {/* إظهار المزيد إذا كان هناك أكثر من 3 منتجات */}
              {cart?.items && cart.items.length > 3 && (
                <p className='text-xs text-gray-500 text-center mt-2'>و {cart.items.length - 3} منتجات أخرى...</p>
              )}
            </div>

            <DropdownMenuSeparator />

            {/* الإجمالي */}
            <div className='p-2'>
              <div className='flex justify-between items-center mb-2'>
                <span className='font-semibold'>الإجمالي:</span>
                <span className='font-bold text-green-600'>{cart?.totalAmount?.toFixed(2) || '0.00'} د.ت</span>
              </div>

              {/* أزرار العمل */}
              <div className='flex gap-2'>
                <Button asChild variant='outline' size='sm' className='flex-1'>
                  <Link href='/cart'>
                    <Eye className='h-4 w-4 ml-1' />
                    عرض السلة
                  </Link>
                </Button>

                <Button asChild size='sm' className='flex-1 bg-green-600 hover:bg-green-700'>
                  <Link href='/checkout'>إتمام الطلب</Link>
                </Button>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CartDropdown;
