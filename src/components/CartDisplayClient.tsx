'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CartItemControls from '@/components/CartItemControls';
import ClearCartButton from '@/components/ClearCartButton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { createClient } from '@/lib/supabase/client';

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
  initialShipping?: number;
  initialGrandTotal?: number;
}

export default function CartDisplayClient({ initialItems, initialTotal, initialShipping }: CartDisplayClientProps) {
  const router = useRouter();
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [total, setTotal] = useState<number>(initialTotal);

  // Seed deliveryFee with initialShipping when subtotal < 100 on server, will be refined after fetching store settings
  const [deliveryFee, setDeliveryFee] = useState<number | null>(
    typeof initialShipping === 'number' ? initialShipping : null
  );

  // Payment dialog state
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash_on_delivery' | 'mobile_payment' | 'bank_transfer' | 'paypal'>('cash_on_delivery');

  useEffect(() => {
    const fetchStoreSettings = async () => {
      try {
        const resp = await fetch('/api/store-settings/delivery-fee', { cache: 'no-store' });
        const json = await resp.json();
        // API returns 200 with default 0 even on failure; just use value if number
        setDeliveryFee(typeof json.delivery_fee === 'number' ? json.delivery_fee : 0);
      } catch (e) {
        console.warn('Error fetching store settings (client):', e);
        setDeliveryFee(0);
      }
    };

    fetchStoreSettings();
  }, []);

  // Calculate shipping and grand total (always apply delivery fee)
  const shipping = deliveryFee !== null ? deliveryFee : 0;
  const grandTotal = total + shipping;

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
              <span>رسوم التوصيل</span>
              <span>{shipping.toFixed(2)} د.ت</span>
            </div>
            <div className="border-t pt-3 mt-3 flex justify-between text-xl font-bold text-honey-dark">
              <span>المجموع الإجمالي</span>
              <span>{grandTotal.toFixed(2)} د.ت</span>
            </div>
          </div>
          <Button 
            size="lg"
            className="w-full bg-honey hover:bg-honey-dark text-white text-lg py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            onClick={() => setOpenPaymentDialog(true)}
          >
            الانتقال إلى الدفع
          </Button>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            سيتم تطبيق الضرائب عند الدفع.
          </p>
        </div>
      </div>

      {/* Payment Method Dialog */}
      <Dialog open={openPaymentDialog} onOpenChange={setOpenPaymentDialog}>
        <DialogContent className="sm:max-w-[520px]">
          <DialogHeader>
            <DialogTitle>اختر طريقة الدفع</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <RadioGroup value={selectedPaymentMethod} onValueChange={(v) => setSelectedPaymentMethod(v as any)} className="space-y-3">
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="cash_on_delivery" id="pm_cod" />
                <Label htmlFor="pm_cod" className="cursor-pointer flex-1">
                  <div className="font-semibold">الدفع عند الاستلام</div>
                  <div className="text-sm text-gray-600">ادفع نقداً عند وصول الطلب</div>
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="mobile_payment" id="pm_edinar" />
                <Label htmlFor="pm_edinar" className="cursor-pointer flex-1">
                  <div className="font-semibold">الخصم من بطاقة e-Dinar</div>
                  <div className="text-sm text-gray-600">الدفع ببطاقة e-Dinar بشكل آمن</div>
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="bank_transfer" id="pm_postal" />
                <Label htmlFor="pm_postal" className="cursor-pointer flex-1">
                  <div className="font-semibold">حوالة بريدية</div>
                  <div className="text-sm text-gray-600">الدفع عبر الحوالة البريدية</div>
                </Label>
              </div>
              <div className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50">
                <RadioGroupItem value="paypal" id="pm_paypal" />
                <Label htmlFor="pm_paypal" className="cursor-pointer flex-1">
                  <div className="font-semibold">PayPal</div>
                  <div className="text-sm text-gray-600">ادفع بأمان عبر PayPal</div>
                </Label>
              </div>
            </RadioGroup>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenPaymentDialog(false)}>إلغاء</Button>
            <Button
              onClick={() => {
                try {
                  if (typeof window !== 'undefined') {
                    sessionStorage.setItem('checkout.paymentMethod', selectedPaymentMethod);
                  }
                } catch {}
                router.push(`/checkout?method=${encodeURIComponent(selectedPaymentMethod)}`);
              }}
            >
              متابعة
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
