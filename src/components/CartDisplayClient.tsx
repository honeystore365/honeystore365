'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import CartItemControls from '@/components/CartItemControls';
import ClearCartButton from '@/components/ClearCartButton';
import { useSession } from '@/context/SessionProvider';
import { getCustomerDetailsForCheckout, createOrder } from '@/actions/checkoutActions';
import { useToast } from '@/hooks/use-toast';

// Types
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

const DELIVERY_FEE = 10;

export default function CartDisplayClient({ initialItems, initialTotal }: CartDisplayClientProps) {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [total, setTotal] = useState<number>(initialTotal);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const { session, loading: sessionLoading } = useSession();
  const { toast } = useToast();

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
  };

  const handleRemoveItem = (cartItemId: string) => {
    setItems(currentItems => currentItems.filter(item => item.id !== cartItemId));
  };

  const handleCartCleared = () => {
    setItems([]);
    toast({ title: "السلة", description: "تم تفريغ السلة بنجاح." });
  };

  const handleProceedToPayment = async () => {
    setIsLoading(true);
    console.log('[CartDisplayClient] handleProceedToPayment called.');
    console.log('[CartDisplayClient] Session loading:', sessionLoading);
    console.log('[CartDisplayClient] Current session:', session);


    if (sessionLoading) {
      console.log('[CartDisplayClient] Session is still loading.');
      toast({ title: "الرجاء الانتظار", description: "جاري التحقق من جلسة المستخدم...", variant: "default" });
      setIsLoading(false);
      return;
    }

    if (!session) {
      console.log('[CartDisplayClient] No active session, redirecting to login.');
      toast({ title: "مستخدم غير مسجل", description: "الرجاء تسجيل الدخول للمتابعة.", variant: "destructive" });
      router.push('/auth/login?redirect=/cart');
      setIsLoading(false);
      return;
    }

    console.log('[CartDisplayClient] Session found, fetching customer details...');
    const { customer_id, first_name, last_name, address, error: customerDetailsError } = await getCustomerDetailsForCheckout();
    console.log('[CartDisplayClient] Customer details fetch result:', { customer_id, first_name, last_name, address, customerDetailsError });


    if (customerDetailsError) {
      console.error('[CartDisplayClient] Error fetching customer details:', customerDetailsError);
      toast({ title: "خطأ", description: `فشل في جلب بيانات العميل: ${customerDetailsError}`, variant: "destructive" });
      setIsLoading(false);
      return;
    }

    if (!customer_id) {
        console.error('[CartDisplayClient] Customer ID not found.');
        toast({ title: "خطأ", description: "لم يتم العثور على حساب العميل.", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    if (!first_name || !last_name || !address || !address.phone_number || !address.address_line_1) {
      let missingFields = [];
      if (!first_name) missingFields.push("الاسم الأول");
      if (!last_name) missingFields.push("اسم العائلة");
      if (!address || !address.address_line_1) missingFields.push("العنوان");
      if (!address || !address.phone_number) missingFields.push("رقم الهاتف");

      console.log('[CartDisplayClient] Missing customer profile information:', missingFields);
      toast({
        title: "معلومات ناقصة",
        description: `الرجاء إكمال البيانات التالية في ملفك الشخصي: ${missingFields.join(', ')}.`,
        variant: "default",
        duration: 6000,
      });
      setIsLoading(false);
      router.push('/profile?redirect=/cart&reason=profile_incomplete');
      return;
    }

    console.log('[CartDisplayClient] Customer details are complete. Preparing order data...');
    const orderParamsData = {
      customerId: customer_id,
      shippingAddressId: address.id,
      items: items.filter(item => item.product !== null) as Required<CartItem>[],
      totalAmount: total,
      deliveryFee: DELIVERY_FEE,
      paymentMethod: 'Cash on Delivery',
    };
    console.log('[CartDisplayClient] Order parameters:', orderParamsData);


    console.log('[CartDisplayClient] Creating order...');
    const { orderId, error: orderError } = await createOrder(orderParamsData);
    console.log('[CartDisplayClient] Create order result:', { orderId, orderError });


    if (orderError || !orderId) {
      console.error('[CartDisplayClient] Error creating order:', orderError);
      toast({ title: "خطأ في إنشاء الطلب", description: orderError || "حدث خطأ غير متوقع.", variant: "destructive" });
      setIsLoading(false);
      return;
    }

    console.log('[CartDisplayClient] Order created successfully with ID:', orderId);
    try {
      console.log('[CartDisplayClient] Order creation successful. Attempting to show success toast and clear cart...');
      // Order created successfully, show confirmation message
      toast({
          title: "تم تأكيد الطلب بنجاح!",
          description: "سيقوم مندوبنا بالاتصال بك قريباً لتأكيد الطلب.",
          variant: "default",
          duration: 7000,
      });
      console.log('[CartDisplayClient] Success toast triggered.');
      setItems([]); // Clear cart after successful order placement
      console.log('[CartDisplayClient] setItems([]) called.');
      setIsLoading(false);
      console.log('[CartDisplayClient] setIsLoading(false) called.');
    } catch (clientError) {
      console.error('[CartDisplayClient] Error during client-side success handling:', clientError);
      toast({
        title: "خطأ في معالجة الطلب",
        description: "تم إنشاء الطلب بنجاح ولكن حدث خطأ في تحديث الواجهة.",
        variant: "destructive",
        duration: 7000,
      });
      setIsLoading(false); // Ensure loading is false even if client-side fails
    }
  };

  if (items.length === 0 && !isLoading) {
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

  const currentTotalWithDelivery = total + (items.length > 0 ? DELIVERY_FEE : 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
      <div className="lg:col-span-2 space-y-6">
        {items.map((item: CartItem) => {
          if (!item.product) {
            return (
              <div key={item.id} className="bg-white p-4 rounded-xl shadow-lg flex justify-between items-center border border-destructive">
                <p className="text-destructive">منتج غير متوفر أو تم حذفه.</p>
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
                  fill
                  sizes="(max-width: 640px) 6rem, 8rem"
                  style={{ objectFit: 'cover' }}
                  className="rounded-lg"
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
            <ClearCartButton
                className="text-destructive border-destructive hover:bg-destructive/10"
                onCartCleared={handleCartCleared}
            />
          </div>
        )}
      </div>

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
              {items.length > 0 ? (
                <span>{DELIVERY_FEE.toFixed(2)} د.ت</span>
              ) : (
                <span className="text-green-600">مجاني</span>
              )}
            </div>
            <div className="border-t pt-3 mt-3 flex justify-between text-xl font-bold text-honey-dark">
              <span>المجموع الإجمالي</span>
              <span>{currentTotalWithDelivery.toFixed(2)} د.ت</span>
            </div>
          </div>
          <Button
            size="lg"
            className="w-full bg-honey hover:bg-honey-dark text-white text-lg py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
            onClick={handleProceedToPayment}
            disabled={isLoading || items.length === 0 || sessionLoading}
          >
            {isLoading ? 'جاري المعالجة...' : 'الانتقال إلى الدفع'}
          </Button>
          <p className="text-xs text-muted-foreground mt-4 text-center">
            سيتم تطبيق الضرائب عند الدفع. (الدفع عند الاستلام)
          </p>
        </div>
      </div>
    </div>
  );
}
