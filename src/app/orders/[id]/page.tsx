import ErrorPage from '@/components/ErrorPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientServerReadOnly } from '@/lib/supabase/server-readonly';
import { ArrowLeft, CreditCard, MapPin, Phone, Truck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { redirect } from 'next/navigation';

interface OrderPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const { id } = await params;
  const supabase = await createClientServerReadOnly();

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login?redirect=/orders');
  }

  // Fetch order details
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        *,
        products (*)
      ),
      addresses (*)
    `
    )
    .eq('id', id)
    .eq('customer_id', user.id)
    .single();

  if (orderError || !order) {
    return (
      <ErrorPage
        title='الطلب غير موجود'
        message='لم يتم العثور على الطلب المطلوب. قد يكون الطلب محذوفاً أو لا تملك صلاحية الوصول إليه.'
        showRetry={true}
        showHome={false}
      />
    );
  }

  // Get customer details
  const { data: customer } = await supabase
    .from('customers')
    .select('first_name, last_name')
    .eq('id', user.id)
    .single();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Confirmation':
        return (
          <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
            في انتظار التأكيد
          </Badge>
        );
      case 'Awaiting Payment':
        return (
          <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
            في انتظار الدفع
          </Badge>
        );
      case 'Confirmed':
        return (
          <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
            مؤكد
          </Badge>
        );
      case 'Processing':
        return (
          <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200'>
            قيد التحضير
          </Badge>
        );
      case 'Shipped':
        return (
          <Badge variant='outline' className='bg-indigo-50 text-indigo-700 border-indigo-200'>
            تم الشحن
          </Badge>
        );
      case 'Delivered':
        return (
          <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
            تم التوصيل
          </Badge>
        );
      case 'Cancelled':
        return <Badge variant='destructive'>ملغي</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'cash_on_delivery':
        return <Truck className='w-4 h-4' />;
      case 'bank_transfer':
        return <CreditCard className='w-4 h-4' />;
      case 'paypal':
        return <CreditCard className='w-4 h-4' />;
      default:
        return <CreditCard className='w-4 h-4' />;
    }
  };

  const getPaymentMethodText = (method: string) => {
    switch (method) {
      case 'cash_on_delivery':
        return 'الدفع عند الاستلام';
      case 'bank_transfer':
        return 'تحويل بنكي';
      case 'paypal':
        return 'PayPal';
      default:
        return method;
    }
  };

  return (
    <div className='container mx-auto py-10 px-4'>
      <div className='mb-6'>
        <Button variant='ghost' asChild className='mb-4'>
          <Link href='/orders'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            العودة إلى الطلبات
          </Link>
        </Button>
        <div className='flex items-center justify-between'>
          <h1 className='text-3xl font-bold text-honey-dark'>تفاصيل الطلب #{order.id.slice(-8)}</h1>
          {getStatusBadge(order.status)}
        </div>
        <p className='text-muted-foreground mt-2'>
          تاريخ الطلب: {new Date(order.order_date).toLocaleDateString('ar-TN')}
        </p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Order Items */}
        <div className='lg:col-span-2'>
          <Card>
            <CardHeader>
              <CardTitle>المنتجات المطلوبة</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {order.order_items.map((item: any) => (
                <div key={item.id} className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
                  <div className='relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0'>
                    <Image
                      src={item.products?.image_url || 'https://picsum.photos/200'}
                      alt={item.products?.name || 'Product'}
                      fill
                      style={{ objectFit: 'cover' }}
                      className='rounded-lg'
                    />
                  </div>
                  <div className='flex-grow'>
                    <h3 className='font-semibold text-gray-800'>{item.products?.name}</h3>
                    <p className='text-sm text-gray-600'>الكمية: {item.quantity}</p>
                    <p className='text-sm text-gray-600'>السعر: {item.price} د.ت</p>
                  </div>
                  <div className='text-right'>
                    <p className='font-bold text-gray-800'>{(item.price * item.quantity).toFixed(2)} د.ت</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {order.notes && (
            <Card className='mt-6'>
              <CardHeader>
                <CardTitle>ملاحظات الطلب</CardTitle>
              </CardHeader>
              <CardContent>
                <p className='text-gray-700'>{order.notes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary & Details */}
        <div className='space-y-6'>
          {/* Order Summary */}
          <Card>
            <CardHeader>
              <CardTitle>ملخص الطلب</CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div className='flex justify-between'>
                <span>المجموع الفرعي:</span>
                <span>{(order.total_amount - (order.delivery_fee || 0)).toFixed(2)} د.ت</span>
              </div>
              <div className='flex justify-between'>
                <span>رسوم التوصيل:</span>
                <span>{(order.delivery_fee || 0).toFixed(2)} د.ت</span>
              </div>
              <div className='border-t pt-3 flex justify-between text-lg font-bold text-honey-dark'>
                <span>المجموع الإجمالي:</span>
                <span>{order.total_amount.toFixed(2)} د.ت</span>
              </div>
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle>طريقة الدفع</CardTitle>
            </CardHeader>
            <CardContent>
              <div className='flex items-center gap-2'>
                {getPaymentMethodIcon(order.payment_method)}
                <span>{getPaymentMethodText(order.payment_method)}</span>
              </div>
              {order.payment_method === 'cash_on_delivery' && (
                <p className='text-sm text-gray-600 mt-2'>سيقوم مندوبنا بالاتصال بك لتأكيد الطلب وموعد التوصيل.</p>
              )}
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='w-4 h-4' />
                عنوان التوصيل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <p>
                  <strong>الاسم:</strong> {customer?.first_name} {customer?.last_name}
                </p>
                <p>
                  <strong>العنوان:</strong> {order.addresses?.address_line_1}
                </p>
                {order.addresses?.address_line_2 && (
                  <p>
                    <strong>العنوان الثاني:</strong> {order.addresses.address_line_2}
                  </p>
                )}
                <p>
                  <strong>المدينة:</strong> {order.addresses?.city}
                </p>
                {order.addresses?.phone_number && (
                  <p className='flex items-center gap-2'>
                    <Phone className='w-4 h-4' />
                    {order.addresses.phone_number}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Contact Support */}
          <Card>
            <CardHeader>
              <CardTitle>تحتاج مساعدة؟</CardTitle>
            </CardHeader>
            <CardContent>
              <p className='text-sm text-gray-600 mb-4'>إذا كان لديك أي استفسار حول طلبك، لا تتردد في الاتصال بنا.</p>
              <Button variant='outline' className='w-full'>
                <Phone className='w-4 h-4 mr-2' />
                اتصل بنا
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
