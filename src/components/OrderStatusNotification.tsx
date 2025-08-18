'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertCircle, CheckCircle, Clock, CreditCard, Package, Phone, Truck, XCircle } from 'lucide-react';

interface OrderStatusNotificationProps {
  status: string;
  paymentMethod: string;
  orderId: string;
  customerPhone?: string;
}

export default function OrderStatusNotification({
  status,
  paymentMethod,
  orderId,
  customerPhone,
}: OrderStatusNotificationProps) {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'Pending Confirmation':
        return {
          icon: <Clock className='w-5 h-5' />,
          color: 'bg-yellow-50 border-yellow-200 text-yellow-800',
          title: 'في انتظار التأكيد',
          description: 'تم استلام طلبك وهو قيد المراجعة',
        };
      case 'Awaiting Payment':
        return {
          icon: <CreditCard className='w-5 h-5' />,
          color: 'bg-blue-50 border-blue-200 text-blue-800',
          title: 'في انتظار الدفع',
          description: 'يرجى إتمام عملية الدفع لتأكيد طلبك',
        };
      case 'Confirmed':
        return {
          icon: <CheckCircle className='w-5 h-5' />,
          color: 'bg-green-50 border-green-200 text-green-800',
          title: 'تم تأكيد الطلب',
          description: 'تم تأكيد طلبك وسيتم تحضيره قريباً',
        };
      case 'Processing':
        return {
          icon: <Package className='w-5 h-5' />,
          color: 'bg-purple-50 border-purple-200 text-purple-800',
          title: 'قيد التحضير',
          description: 'جاري تحضير طلبك للشحن',
        };
      case 'Shipped':
        return {
          icon: <Truck className='w-5 h-5' />,
          color: 'bg-indigo-50 border-indigo-200 text-indigo-800',
          title: 'تم الشحن',
          description: 'تم شحن طلبك وهو في الطريق إليك',
        };
      case 'Delivered':
        return {
          icon: <CheckCircle className='w-5 h-5' />,
          color: 'bg-green-50 border-green-200 text-green-800',
          title: 'تم التوصيل',
          description: 'تم توصيل طلبك بنجاح',
        };
      case 'Cancelled':
        return {
          icon: <XCircle className='w-5 h-5' />,
          color: 'bg-red-50 border-red-200 text-red-800',
          title: 'تم الإلغاء',
          description: 'تم إلغاء هذا الطلب',
        };
      default:
        return {
          icon: <AlertCircle className='w-5 h-5' />,
          color: 'bg-gray-50 border-gray-200 text-gray-800',
          title: status,
          description: 'حالة الطلب',
        };
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

  const statusConfig = getStatusConfig(status);

  const renderActionMessage = () => {
    if (status === 'Pending Confirmation' && paymentMethod === 'cash_on_delivery') {
      return (
        <Card className='mt-4 bg-blue-50 border-blue-200'>
          <CardContent className='p-4'>
            <div className='flex items-start gap-3'>
              <Phone className='w-5 h-5 text-blue-600 mt-0.5' />
              <div>
                <h4 className='font-semibold text-blue-900 mb-1'>سيتم الاتصال بك قريباً</h4>
                <p className='text-sm text-blue-700 mb-2'>
                  سيقوم أحد مندوبينا بالاتصال بك على الرقم {customerPhone} لتأكيد تفاصيل الطلب وموعد التوصيل.
                </p>
                <p className='text-xs text-blue-600'>
                  يرجى التأكد من أن هاتفك متاح خلال ساعات العمل (9 صباحاً - 6 مساءً)
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (status === 'Awaiting Payment' && paymentMethod === 'bank_transfer') {
      return (
        <Card className='mt-4 bg-orange-50 border-orange-200'>
          <CardContent className='p-4'>
            <div className='flex items-start gap-3'>
              <CreditCard className='w-5 h-5 text-orange-600 mt-0.5' />
              <div>
                <h4 className='font-semibold text-orange-900 mb-1'>تفاصيل التحويل البنكي</h4>
                <p className='text-sm text-orange-700 mb-2'>
                  سيتم إرسال تفاصيل الحساب البنكي إلى بريدك الإلكتروني خلال دقائق.
                </p>
                <div className='bg-orange-100 p-2 rounded text-xs text-orange-800'>
                  <strong>مهم:</strong> يرجى إرسال إيصال التحويل عبر WhatsApp أو البريد الإلكتروني لتأكيد الدفع.
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (status === 'Awaiting Payment' && paymentMethod === 'paypal') {
      return (
        <Card className='mt-4 bg-blue-50 border-blue-200'>
          <CardContent className='p-4'>
            <div className='flex items-start gap-3'>
              <CreditCard className='w-5 h-5 text-blue-600 mt-0.5' />
              <div>
                <h4 className='font-semibold text-blue-900 mb-1'>الدفع عبر PayPal</h4>
                <p className='text-sm text-blue-700 mb-3'>
                  سيتم توجيهك لإتمام الدفع عبر PayPal. إذا لم يتم التوجيه تلقائياً، استخدم الرابط أدناه.
                </p>
                <Button size='sm' className='bg-blue-600 hover:bg-blue-700'>
                  إتمام الدفع عبر PayPal
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  return (
    <div className='space-y-4'>
      <Alert className={statusConfig.color}>
        <div className='flex items-center gap-3'>
          {statusConfig.icon}
          <div className='flex-grow'>
            <AlertTitle className='mb-1'>{statusConfig.title}</AlertTitle>
            <AlertDescription>{statusConfig.description}</AlertDescription>
          </div>
          <Badge variant='outline' className='ml-auto'>
            طلب #{orderId.slice(-8)}
          </Badge>
        </div>
      </Alert>

      <div className='flex items-center justify-between text-sm text-gray-600'>
        <span>
          طريقة الدفع: <strong>{getPaymentMethodText(paymentMethod)}</strong>
        </span>
        <span>
          تاريخ الطلب: <strong>{new Date().toLocaleDateString('ar-TN')}</strong>
        </span>
      </div>

      {renderActionMessage()}

      {/* Contact Support */}
      <Card className='bg-gray-50'>
        <CardContent className='p-4'>
          <div className='flex items-center gap-3'>
            <Phone className='w-4 h-4 text-gray-600' />
            <div className='text-sm'>
              <span className='text-gray-600'>تحتاج مساعدة؟ </span>
              <Button variant='link' className='p-0 h-auto text-honey hover:text-honey-dark'>
                اتصل بخدمة العملاء
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
