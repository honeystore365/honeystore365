// Version finale de la page admin avec workflow simplifié
import SimpleAdminOrderActions from '@/components/admin/SimpleAdminOrderActions';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@supabase/supabase-js';
import { ArrowLeft, CreditCard, MapPin, Package, Phone, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface FinalPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function FinalPage({ params }: FinalPageProps) {
  const { id } = await params;

  // Client direct avec service key
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  // Fetch order with all related data in one query
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        *,
        products (*)
      )
    `
    )
    .eq('id', id)
    .single();

  if (orderError || !order) {
    return (
      <div className='container mx-auto py-10 px-4 text-center'>
        <h1 className='text-3xl font-bold mb-8 text-destructive'>الطلب غير موجود</h1>
        <p className='text-lg text-muted-foreground mb-6'>لم يتم العثور على الطلب المطلوب.</p>
        <Button asChild>
          <Link href='/admin/orders'>العودة إلى قائمة الطلبات</Link>
        </Button>
      </div>
    );
  }

  // Extract order items from the combined query
  const orderItems = order.order_items || [];

  // Fetch customer info
  const { data: customer, error: customerError } = await supabase
    .from('customers')
    .select('first_name, last_name, email')
    .eq('id', order.customer_id)
    .single();

  // Fetch address info
  const { data: address, error: addressError } = await supabase
    .from('addresses')
    .select('*')
    .eq('customer_id', order.customer_id)
    .single();

  // Order items are already enriched with product data from the combined query
  let enrichedOrderItems =
    orderItems?.map((item: any) => ({
      ...item,
      product: item.products || null,
    })) || [];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Pending Confirmation':
        return (
          <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
            في انتظار التأكيد
          </Badge>
        );
      case 'Confirmed':
        return (
          <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
            مؤكد
          </Badge>
        );
      case 'Delivered':
        return (
          <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
            تم التوصيل
          </Badge>
        );
      case 'Cancelled':
        return <Badge variant='destructive'>ملغي</Badge>;
      default:
        return <Badge variant='outline'>{status}</Badge>;
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
          <Link href='/admin/orders'>
            <ArrowLeft className='w-4 h-4 mr-2' />
            العودة إلى قائمة الطلبات
          </Link>
        </Button>
        <div className='flex items-center justify-between mb-4'>
          <h1 className='text-3xl font-bold text-honey-dark'>تفاصيل الطلب #{id.slice(-8)}</h1>
          {getStatusBadge(order.status || 'Pending Confirmation')}
        </div>
        <p className='text-muted-foreground'>تاريخ الطلب: {new Date(order.order_date).toLocaleDateString('ar-TN')}</p>
      </div>

      <div className='grid grid-cols-1 lg:grid-cols-3 gap-6'>
        {/* Order Items */}
        <div className='lg:col-span-2 space-y-6'>
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <Package className='w-5 h-5' />
                المنتجات المطلوبة ({enrichedOrderItems.length})
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {enrichedOrderItems.length === 0 ? (
                <div className='text-center py-8'>
                  <Package className='w-12 h-12 text-gray-400 mx-auto mb-4' />
                  <p className='text-gray-600'>لا توجد منتجات في هذا الطلب</p>
                </div>
              ) : (
                <>
                  {enrichedOrderItems.map((item: any) => (
                    <div key={item.id} className='flex items-center gap-4 p-4 bg-gray-50 rounded-lg'>
                      <div className='relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0'>
                        <Image
                          src={item.product?.image_url || 'https://picsum.photos/200'}
                          alt={item.product?.name || 'Product'}
                          fill
                          style={{ objectFit: 'cover' }}
                          className='rounded-lg'
                        />
                      </div>
                      <div className='flex-grow'>
                        <h3 className='font-semibold text-gray-800'>{item.product?.name || 'منتج غير محدد'}</h3>
                        <p className='text-sm text-gray-600'>الكمية: {item.quantity}</p>
                        <p className='text-sm text-gray-600'>السعر الوحدة: {item.price} د.ت</p>
                        {item.product?.description && (
                          <p className='text-xs text-gray-500 mt-1'>{item.product.description}</p>
                        )}
                      </div>
                      <div className='text-right'>
                        <p className='font-bold text-gray-800'>{(item.price * item.quantity).toFixed(2)} د.ت</p>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </CardContent>
          </Card>

          {/* Simplified Admin Actions */}
          <SimpleAdminOrderActions orderId={id} currentStatus={order.status || 'Pending Confirmation'} />
        </div>

        {/* Order Summary & Details */}
        <div className='space-y-6'>
          {/* Customer Info */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <User className='w-5 h-5' />
                معلومات العميل
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              <div>
                <p className='text-sm text-gray-600'>الاسم:</p>
                <p className='font-semibold'>
                  {customer ? `${customer.first_name} ${customer.last_name}` : 'غير متوفر'}
                </p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>البريد الإلكتروني:</p>
                <p className='font-semibold'>{customer?.email || 'غير متوفر'}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>رقم العميل:</p>
                <p className='font-semibold text-honey'>#{order.customer_id.slice(-8)}</p>
              </div>
              <div>
                <p className='text-sm text-gray-600'>رقم الهاتف:</p>
                <p className='font-semibold flex items-center gap-2'>
                  <Phone className='w-4 h-4' />
                  {address?.phone_number || 'غير متوفر'}
                </p>
              </div>
            </CardContent>
          </Card>

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
              <CardTitle className='flex items-center gap-2'>
                <CreditCard className='w-5 h-5' />
                طريقة الدفع
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className='font-semibold'>{getPaymentMethodText(order.payment_method)}</p>
            </CardContent>
          </Card>

          {/* Delivery Address */}
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <MapPin className='w-5 h-5' />
                عنوان التوصيل
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-2'>
                <p>
                  <strong>العنوان:</strong> {address?.address_line_1 || 'غير متوفر'}
                </p>
                {address?.address_line_2 && (
                  <p>
                    <strong>العنوان الثاني:</strong> {address.address_line_2}
                  </p>
                )}
                <p>
                  <strong>المدينة:</strong> {address?.city || 'غير متوفر'}
                </p>
                <p>
                  <strong>الرمز البريدي:</strong> {address?.postal_code || 'غير محدد'}
                </p>
                <p>
                  <strong>البلد:</strong> {address?.country || 'تونس'}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
