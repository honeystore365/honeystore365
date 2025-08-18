'use client';

import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartProvider';
import { useSession } from '@/context/SessionProvider';
import { Loader2, Minus, Plus, ShoppingCart } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AddToCartButtonProps {
  productId: string;
  productName: string;
  className?: string;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'sm' | 'default' | 'lg';
  showQuantityControls?: boolean;
}

export function AddToCartButton({
  productId,
  productName,
  className,
  variant = 'default',
  size = 'default',
  showQuantityControls = false,
}: AddToCartButtonProps) {
  const { session } = useSession();
  const { addToCart, cart } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);

  // Vérifier si le produit est déjà dans le panier
  const cartItem = cart?.items?.find(item => item.productId === productId);
  const currentQuantity = cartItem?.quantity || 0;

  const handleAddToCart = async () => {
    if (!session) {
      toast.error('يجب تسجيل الدخول أولاً', {
        description: 'قم بتسجيل الدخول لإضافة المنتجات إلى السلة',
      });
      return;
    }

    setIsAdding(true);

    try {
      const success = await addToCart(productId, quantity);

      if (success) {
        toast.success('تم إضافة المنتج إلى السلة', {
          description: `تم إضافة ${quantity} من ${productName} إلى سلة التسوق`,
        });

        // إعادة تعيين الكمية إلى 1 بعد الإضافة الناجحة
        setQuantity(1);
      } else {
        toast.error('فشل في إضافة المنتج', {
          description: 'حدث خطأ أثناء إضافة المنتج إلى السلة',
        });
      }
    } catch (error) {
      console.error('خطأ في إضافة المنتج:', error);
      toast.error('فشل في إضافة المنتج', {
        description: 'حدث خطأ غير متوقع',
      });
    } finally {
      setIsAdding(false);
    }
  };

  const incrementQuantity = () => {
    setQuantity(prev => Math.min(prev + 1, 99)); // حد أقصى 99
  };

  const decrementQuantity = () => {
    setQuantity(prev => Math.max(prev - 1, 1)); // حد أدنى 1
  };

  if (showQuantityControls) {
    return (
      <div className='flex items-center gap-2'>
        {/* أدوات التحكم في الكمية */}
        <div className='flex items-center border rounded-lg'>
          <Button
            variant='ghost'
            size='sm'
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className='h-8 w-8 p-0'
          >
            <Minus className='h-4 w-4' />
          </Button>

          <span className='px-3 py-1 text-sm font-medium min-w-[2rem] text-center'>{quantity}</span>

          <Button
            variant='ghost'
            size='sm'
            onClick={incrementQuantity}
            disabled={quantity >= 99}
            className='h-8 w-8 p-0'
          >
            <Plus className='h-4 w-4' />
          </Button>
        </div>

        {/* زر الإضافة */}
        <Button onClick={handleAddToCart} disabled={isAdding} variant={variant} size={size} className={className}>
          {isAdding ? <Loader2 className='h-4 w-4 animate-spin ml-2' /> : <ShoppingCart className='h-4 w-4 ml-2' />}
          {isAdding ? 'جاري الإضافة...' : 'أضف للسلة'}
        </Button>
      </div>
    );
  }

  return (
    <Button onClick={handleAddToCart} disabled={isAdding} variant={variant} size={size} className={className}>
      {isAdding ? <Loader2 className='h-4 w-4 animate-spin ml-2' /> : <ShoppingCart className='h-4 w-4 ml-2' />}
      {isAdding ? 'جاري الإضافة...' : currentQuantity > 0 ? `في السلة (${currentQuantity})` : 'أضف للسلة'}
    </Button>
  );
}

export default AddToCartButton;
