'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import CartItemControls from '@/components/CartItemControls';
import ClearCartButton from '@/components/ClearCartButton';

// Types should match those in cart/page.tsx and cartActions.ts
interface CartProduct {
  id: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
  description: string | null;
}

interface CartItem {
  id: string; // cart_item_id
  quantity: number;
  product: CartProduct | null;
}

interface CartDisplayClientProps {
  initialItems: CartItem[];
  initialTotal: number;
}

export default function CartDisplayClient({ initialItems, initialTotal }: CartDisplayClientProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [total, setTotal] = useState<number>(initialTotal);

  // Recalculate total whenever items change
  useEffect(() => {
    let newTotal = 0;
    items.forEach(item => {
      const productPrice = item.product?.price ?? 0;
      newTotal += productPrice * item.quantity;
    });
    setTotal(newTotal);
  }, [items]);

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    setItems(currentItems =>
      currentItems.map(item =>
        item.id === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
    // Total is recalculated by the useEffect hook
  };

  const handleRemoveItem = (cartItemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== cartItemId));
     // Total is recalculated by the useEffect hook
  };
  
  const handleCartCleared = () => {
      setItems([]); // Clear items locally after successful server action
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto py-10 px-4 text-center">
        <h1 className="text-3xl font-bold mb-8 text-honey-dark">سلة التسوق فارغة</h1>
        <p className="text-lg text-muted-foreground mb-6">
          لم تقم بإضافة أي منتجات إلى سلتك بعد.
        </p>
        <Button asChild size="lg" className="bg-honey hover:bg-honey-dark text-white">
          <Link href="/products">تصفح المنتجات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      {/* Cart Items List */}
      <div className="lg:col-span-2 space-y-6">
        {items.map((item: CartItem) => {
          if (!item.product) {
            return (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-lg flex justify-between items-center border border-destructive">
                <p className="text-destructive">منتج غير متوفر أو تم حذفه.</p>
                {/* Pass onRemove to handle removal of unavailable items */}
                <CartItemControls 
                    cartItemId={item.id} 
                    initialQuantity={0} 
                    isUnavailable={true} 
                    onRemove={handleRemoveItem} 
                />
              </div>
            );
          }
          return (
            <div key={item.id} className="bg-white p-4 sm:p-6 rounded-xl shadow-lg flex flex-col sm:flex-row items-center gap-4 sm:gap-6 transition-shadow hover:shadow-xl">
              <div className="relative w-24 h-24 sm:w-32 sm:h-32 rounded-lg overflow-hidden flex-shrink-0">
                <Image
                  src={item.product.image_url || 'https://picsum.photos/200'}
                  alt={item.product.name || 'Product Image'}
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="flex-grow text-center sm:text-right">
                <h2 className="text-xl sm:text-2xl font-semibold text-gray-800 hover:text-honey transition-colors">
                  <Link href={`/products/${item.product.id}`}>{item.product.name}</Link>
                </h2>
                <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
                  {item.product.description ? `${item.product.description.substring(0, 70)}...` : ''}
                </p>
                <p className="text-lg font-bold text-honey mt-2 sm:mt-1">
                  {item.product.price} د.ت
                </p>
              </div>
              <div className="mt-4 sm:mt-0">
                <CartItemControls 
                  cartItemId={item.id} 
                  initialQuantity={item.quantity} 
                  onQuantityChange={handleQuantityChange}
                  onRemove={handleRemoveItem}
                />
              </div>
            </div>
          );
        })}
        {items.length > 0 && (
          <div className="mt-6 text-right">
            {/* Pass onCartCleared callback */}
            <ClearCartButton 
                className="text-destructive border-destructive hover:bg-destructive/10" 
                onCartCleared={handleCartCleared} 
            />
          </div>
        )}
      </div>

      {/* Order Summary */}
      <div className="lg:col-span-1 sticky top-24">
        <div className="bg-gray-50 p-6 sm:p-8 rounded-xl shadow-xl border border-honey/30">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 border-b pb-4">
            ملخص الطلب
          </h2>
          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-lg">
              <span>المجموع الفرعي</span>
              <span>{total.toFixed(2)} د.ت</span>
            </div>
            <div className="flex justify-between text-lg">
              <span>الشحن</span>
              <span className="text-green-600">مجاني</span> {/* Or calculate shipping */}
            </div>
            <div className="border-t pt-3 mt-3 flex justify-between text-xl font-bold text-honey-dark">
              <span>المجموع الإجمالي</span>
              <span>{total.toFixed(2)} د.ت</span>
            </div>
          </div>
          <Button 
            size="lg"
            className="w-full bg-honey hover:bg-honey-dark text-white text-lg py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            // onClick={() => router.push('/checkout')} // Or handle checkout action
          >
            الانتقال إلى الدفع
          </Button>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            سيتم تطبيق الضرائب عند الدفع.
          </p>
        </div>
      </div>
    </div>
  );
}
