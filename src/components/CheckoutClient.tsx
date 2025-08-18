'use client';

import { createOrderWithPaymentMethod } from '@/actions/checkoutActions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ErrorBanner } from '@/components/ui/simple-error';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Building2, CreditCard, Truck } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface CartProduct {
  id: string;
  name: string | null;
  price: number | null;
  image_url: string | null;
  description: string | null;
}

interface CartItem {
  id: string;
  quantity: number;
  product: CartProduct | null;
}

interface Customer {
  first_name: string | null;
  last_name: string | null;
}

interface Address {
  address_line_1: string | null;
  city: string | null;
  phone_number: string | null;
}

interface CheckoutClientProps {
  items: CartItem[];
  total: number;
  customer: Customer | null;
  address: Address | null;
  deliveryFee?: number;
  initialPaymentMethod?: 'cash_on_delivery' | 'mobile_payment' | 'bank_transfer' | 'paypal';
}

const DEFAULT_DELIVERY_FEE = 0;

export default function CheckoutClient({ items, total, customer, address, deliveryFee = DEFAULT_DELIVERY_FEE, initialPaymentMethod = 'cash_on_delivery' }: CheckoutClientProps) {
  const [paymentMethod, setPaymentMethod] = useState<string>(initialPaymentMethod);
  const [notes, setNotes] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const router = useRouter();
  const { toast } = useToast();

  // Effective delivery fee, allow client fetch if server provided 0
  const [effectiveFee, setEffectiveFee] = useState<number>(deliveryFee ?? DEFAULT_DELIVERY_FEE);

  // If server sent 0, try to fetch the configured fee client-side
  useEffect(() => {
    async function ensureFee() {
      if ((deliveryFee ?? 0) === 0 && typeof window !== 'undefined') {
        try {
          const resp = await fetch('/api/store-settings/delivery-fee', { cache: 'no-store' });
          const json = await resp.json();
          if (typeof json?.delivery_fee === 'number') {
            setEffectiveFee(json.delivery_fee);
          }
        } catch {
          // keep current fee
        }
      }
    }
    ensureFee();
  }, [deliveryFee]);

  const totalWithDelivery = total + (effectiveFee ?? DEFAULT_DELIVERY_FEE);

  const handleSubmitOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const orderData = {
        items: items.filter(item => item.product !== null),
        totalAmount: total,
        deliveryFee: deliveryFee,
        paymentMethod,
        // notes, // Temporairement désactivé jusqu'à ce que la colonne soit ajoutée
      };

      const orderResult = await createOrderWithPaymentMethod(orderData, paymentMethod);

      if (!orderResult.success || !orderResult.data) {
        const errorMessage = (typeof orderResult.error === 'string' ? orderResult.error : orderResult.error?.message) || 'حدث خطأ غير متوقع.';
        setError(errorMessage);
        toast({
          title: 'خطأ في إنشاء الطلب',
          description: errorMessage,
          variant: 'destructive',
        });
        return;
      }

      const orderId = orderResult.data.id;

      // Show success message based on payment method
      let successMessage = '';
      switch (paymentMethod) {
        case 'cash_on_delivery':
          successMessage = 'تم تأكيد طلبك بنجاح! سيقوم مندوبنا بالاتصال بك قريباً لتأكيد الطلب والتوصيل.';
          break;
        case 'bank_transfer':
          successMessage = 'تم إنشاء طلبك بنجاح! سيتم إرسال تفاصيل التحويل البنكي إليك قريباً.';
          break;
        case 'paypal':
          successMessage = 'تم إنشاء طلبك بنجاح! سيتم توجيهك لإتمام الدفع عبر PayPal.';
          break;
        default:
          successMessage = 'تم تأكيد طلبك بنجاح!';
      }

      toast({
        title: 'تم تأكيد الطلب!',
        description: successMessage,
        variant: 'default',
        duration: 8000,
      });

      // Redirect to order confirmation or orders page
      router.push(`/orders/${orderId}`);
    } catch (error) {
      console.error('Error submitting order:', error);
      const errorMessage = 'حدث خطأ أثناء إرسال الطلب. يرجى المحاولة مرة أخرى.';
      setError(errorMessage);
      toast({
        title: 'خطأ',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validate required address fields
  const missingFields: string[] = [];
  if (!address?.address_line_1) missingFields.push('العنوان');
  if (!address?.city) missingFields.push('المدينة');
  if (!address?.phone_number) missingFields.push('رقم الهاتف');
  const canSubmit = missingFields.length === 0;

  return (
    <div className='grid grid-cols-1 lg:grid-cols-2 gap-8'>
      {/* Order Summary */}
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-xl text-honey-dark'>ملخص الطلب</CardTitle>
          </CardHeader>
          <CardContent className='space-y-4'>
            {items.map(item => {
              if (!item.product) return null;

              return (
                <div key={item.id} className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
                  <div className='relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0'>
                    <Image
                      src={item.product.image_url || 'https://picsum.photos/200'}
                      alt={item.product.name || 'Product'}
                      fill
                      style={{ objectFit: 'cover' }}
                      className='rounded-lg'
                    />
                  </div>
                  <div className='flex-grow'>
                    <h3 className='font-semibold text-gray-800'>{item.product.name}</h3>
                    <p className='text-sm text-gray-600'>الكمية: {item.quantity}</p>
                    <p className='text-sm font-bold text-honey'>{item.product.price} د.ت</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-bold text-gray-800'>
                      {((item.product.price || 0) * item.quantity).toFixed(2)} د.ت
                    </p>
                  </div>
                </div>
              );
            })}

            <div className='border-t pt-4 space-y-2'>
            <div className='flex justify-between'>
            <span>المجموع الفرعي:</span>
            <span>{total.toFixed(2)} د.ت</span>
            </div>
            <div className='flex justify-between'>
            <span>رسوم التوصيل:</span>
            <span>{(effectiveFee ?? DEFAULT_DELIVERY_FEE).toFixed(2)} د.ت</span>
            </div>
            <div className='flex justify-between text-lg font-bold text-honey-dark border-t pt-2'>
            <span>المجموع الإجمالي:</span>
            <span>{totalWithDelivery.toFixed(2)} د.ت</span>
            </div>
              <div className='pt-2 text-sm text-gray-700'>
                  <span className='font-semibold'>طريقة الدفع المختارة:</span>
                  <span className='ml-2'>
                    {paymentMethod === 'cash_on_delivery' && 'الدفع عند الاستلام'}
                    {paymentMethod === 'mobile_payment' && 'الخصم من بطاقة e-Dinar'}
                    {paymentMethod === 'bank_transfer' && 'حوالة بريدية'}
                    {paymentMethod === 'paypal' && 'PayPal'}
                  </span>
                </div>
              </div>
          </CardContent>
        </Card>

        {/* Customer Info */}
        <Card>
          <CardHeader>
            <CardTitle className='text-xl text-honey-dark'>معلومات التوصيل</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-2'>
              <p>
                <strong>الاسم:</strong> {customer?.first_name} {customer?.last_name}
              </p>
              <p>
                <strong>العنوان:</strong> {address?.address_line_1 || '—'}, {address?.city || '—'}
              </p>
              <p>
                <strong>رقم الهاتف:</strong> {address?.phone_number || '—'}
              </p>
              {!canSubmit && (
                <div className='mt-3 p-3 bg-yellow-50 text-yellow-800 rounded-md text-sm'>
                  لإتمام الطلب، يرجى استكمال بيانات التوصيل: {missingFields.join('، ')}.
                  <br />
                  <a href='/profile/edit' className='underline text-honey-dark'>تحديث العنوان الآن</a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Payment Options */}
      <div className='space-y-6'>
        <Card>
          <CardHeader>
            <CardTitle className='text-xl text-honey-dark'>طريقة الدفع</CardTitle>
          </CardHeader>
          <CardContent>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className='space-y-4'>
              <div className='flex items-center space-x-2 space-x-reverse p-4 border rounded-lg hover:bg-gray-50'>
                <RadioGroupItem value='cash_on_delivery' id='cash_on_delivery' />
                <Label htmlFor='cash_on_delivery' className='flex items-center gap-3 cursor-pointer flex-grow'>
                  <Truck className='w-5 h-5 text-honey' />
                  <div>
                    <div className='font-semibold'>الدفع عند الاستلام</div>
                    <div className='text-sm text-gray-600'>ادفع نقداً عند وصول الطلب</div>
                  </div>
                </Label>
              </div>

              <div className='flex items-center space-x-2 space-x-reverse p-4 border rounded-lg hover:bg-gray-50'>
                <RadioGroupItem value='bank_transfer' id='bank_transfer' />
                <Label htmlFor='bank_transfer' className='flex items-center gap-3 cursor-pointer flex-grow'>
                  <Building2 className='w-5 h-5 text-honey' />
                  <div>
                    <div className='font-semibold'>تحويل بنكي</div>
                    <div className='text-sm text-gray-600'>تحويل مباشر إلى حسابنا البنكي</div>
                  </div>
                </Label>
              </div>

              <div className='flex items-center space-x-2 space-x-reverse p-4 border rounded-lg hover:bg-gray-50'>
                <RadioGroupItem value='paypal' id='paypal' />
                <Label htmlFor='paypal' className='flex items-center gap-3 cursor-pointer flex-grow'>
                  <CreditCard className='w-5 h-5 text-honey' />
                  <div>
                    <div className='font-semibold'>PayPal</div>
                    <div className='text-sm text-gray-600'>ادفع بأمان عبر PayPal</div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </CardContent>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader>
            <CardTitle className='text-xl text-honey-dark'>ملاحظات إضافية</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              placeholder='أضف أي ملاحظات خاصة بطلبك (اختياري)'
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className='min-h-[100px]'
            />
          </CardContent>
        </Card>

        {/* Error Display */}
        {error && <ErrorBanner error={error} />}

        {/* Submit Button */}
        <Button
        onClick={handleSubmitOrder}
        disabled={isLoading || !canSubmit}
        className='w-full bg-honey hover:bg-honey-dark text-white text-lg py-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300'
        size='lg'
        >
        {isLoading ? 'جاري إرسال الطلب...' : (canSubmit ? 'تأكيد الطلب' : 'أكمل بيانات التوصيل أولاً')}
        </Button>
        
        {paymentMethod === 'cash_on_delivery' && (
        <p className='text-sm text-gray-600 text-center'>
        بعد تأكيد الطلب، سيقوم مندوبنا بالاتصال بك لتأكيد التفاصيل وموعد التوصيل.
        </p>
        )}
      </div>
    </div>
  );
}
