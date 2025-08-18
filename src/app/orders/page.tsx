import ErrorPage from '@/components/ErrorPage';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createClientServerReadOnly } from '@/lib/supabase/server-readonly';
import { Eye, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function OrdersPage() {
  const supabase = await createClientServerReadOnly();

  // Check authentication
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect('/auth/login?redirect=/orders');
  }

  // Fetch user's orders
  const { data: orders, error: ordersError } = await supabase
    .from('orders')
    .select(
      `
      *,
      order_items (
        quantity,
        products (name, image_url)
      )
    `
    )
    .eq('customer_id', user.id)
    .order('order_date', { ascending: false });

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

  if (ordersError) {
    return <ErrorPage title='خطأ في تحميل الطلبات' message={ordersError.message} showRetry={true} showHome={true} />;
  }

  if (!orders || orders.length === 0) {
    return (
      <div className='container mx-auto py-10 px-4 text-center'>
        <ShoppingBag className='w-24 h-24 mx-auto text-gray-300 mb-6' />
        <h1 className='text-3xl font-bold mb-8 text-honey-dark'>لا توجد طلبات</h1>
        <p className='text-lg text-muted-foreground mb-6'>لم تقم بإجراء أي طلبات بعد.</p>
        <Button asChild size='lg' className='bg-honey hover:bg-honey-dark text-white'>
          <Link href='/products'>تصفح المنتجات</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10 px-4'>
      <h1 className='text-4xl font-extrabold mb-10 text-center text-honey-dark tracking-tight'>طلباتي</h1>

      <div className='space-y-6'>
        {orders.map((order: any) => (
          <Card key={order.id} className='hover:shadow-lg transition-shadow'>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='text-xl text-honey-dark'>طلب #{order.id.slice(-8)}</CardTitle>
                  <p className='text-sm text-muted-foreground mt-1'>
                    {new Date(order.order_date).toLocaleDateString('ar-TN', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4'>
                <div>
                  <p className='text-sm text-gray-600'>المجموع الإجمالي</p>
                  <p className='font-bold text-lg text-honey'>{order.total_amount.toFixed(2)} د.ت</p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>طريقة الدفع</p>
                  <p className='font-semibold'>{getPaymentMethodText(order.payment_method)}</p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>عدد المنتجات</p>
                  <p className='font-semibold'>
                    {order.order_items.reduce((total: number, item: any) => total + item.quantity, 0)} منتج
                  </p>
                </div>
                <div>
                  <p className='text-sm text-gray-600'>رسوم التوصيل</p>
                  <p className='font-semibold'>{(order.delivery_fee || 0).toFixed(2)} د.ت</p>
                </div>
              </div>

              {/* Order Items Preview */}
              <div className='mb-4'>
                <p className='text-sm text-gray-600 mb-2'>المنتجات:</p>
                <div className='flex flex-wrap gap-2'>
                  {order.order_items.slice(0, 3).map((item: any, index: number) => (
                    <span key={index} className='text-sm bg-gray-100 px-2 py-1 rounded'>
                      {item.products?.name} ({item.quantity})
                    </span>
                  ))}
                  {order.order_items.length > 3 && (
                    <span className='text-sm text-gray-500'>+{order.order_items.length - 3} منتج آخر</span>
                  )}
                </div>
              </div>

              {order.notes && (
                <div className='mb-4'>
                  <p className='text-sm text-gray-600'>ملاحظات:</p>
                  <p className='text-sm text-gray-800 bg-gray-50 p-2 rounded'>
                    {order.notes.length > 100 ? `${order.notes.substring(0, 100)}...` : order.notes}
                  </p>
                </div>
              )}

              <div className='flex justify-between items-center'>
                <div>
                  {order.payment_method === 'cash_on_delivery' && order.status === 'Pending Confirmation' && (
                    <p className='text-sm text-blue-600'>سيقوم مندوبنا بالاتصال بك قريباً لتأكيد الطلب</p>
                  )}
                  {order.payment_method !== 'cash_on_delivery' && order.status === 'Awaiting Payment' && (
                    <p className='text-sm text-orange-600'>في انتظار إتمام عملية الدفع</p>
                  )}
                </div>
                <Button asChild variant='outline'>
                  <Link href={`/orders/${order.id}`}>
                    <Eye className='w-4 h-4 mr-2' />
                    عرض التفاصيل
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className='mt-10 text-center'>
        <Button asChild variant='outline' size='lg'>
          <Link href='/products'>
            <ShoppingBag className='w-4 h-4 mr-2' />
            متابعة التسوق
          </Link>
        </Button>
      </div>
    </div>
  );
}
