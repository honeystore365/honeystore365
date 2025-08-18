'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Download, Loader2, Truck, XCircle, Package } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface SimpleAdminOrderActionsProps {
  orderId: string;
  currentStatus: string;
}

export default function SimpleAdminOrderActions({ orderId, currentStatus }: SimpleAdminOrderActionsProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const router = useRouter();
  const { toast } = useToast();

  const confirmOrder = async () => {
    setIsConfirming(true);

    try {
      const response = await fetch('/api/admin/orders/confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error('فشل في تأكيد الطلب');
      }

      toast({
        title: 'تم تأكيد الطلب',
        description: 'تم تأكيد الطلب بنجاح وسيتم إشعار العميل.',
        variant: 'default',
      });

      router.refresh();
    } catch (error) {
      console.error('Error confirming order:', error);
      toast({
        title: 'خطأ في التأكيد',
        description: 'حدث خطأ أثناء تأكيد الطلب. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsConfirming(false);
    }
  };

  const cancelOrder = async () => {
    setIsCancelling(true);

    try {
      const response = await fetch('/api/admin/orders/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        throw new Error('فشل في إلغاء الطلب');
      }

      toast({
        title: 'تم إلغاء الطلب',
        description: 'تم إلغاء الطلب بنجاح وسيتم إشعار العميل.',
        variant: 'default',
      });

      router.push('/admin/orders');
    } catch (error) {
      console.error('Error cancelling order:', error);
      toast({
        title: 'خطأ في الإلغاء',
        description: 'حدث خطأ أثناء إلغاء الطلب. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsCancelling(false);
    }
  };

  const markAsDelivered = async () => {
    setIsUpdatingStatus(true);

    try {
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status: 'Delivered' }),
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث حالة الطلب');
      }

      toast({
        title: 'تم التوصيل',
        description: 'تم تحديث حالة الطلب إلى "تم التوصيل".',
        variant: 'default',
      });

      router.refresh();
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'خطأ في التحديث',
        description: 'حدث خطأ أثناء تحديث حالة الطلب.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const generatePDF = async () => {
    setIsGeneratingPDF(true);

    try {
      const response = await fetch('/api/admin/orders/generate-invoice', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId }),
      });

      if (!response.ok) {
        // Gestion spécifique pour les commandes annulées
        if (response.status === 400) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'لا يمكن إنشاء فاتورة للطلبات الملغاة');
        }
        throw new Error('فشل في إنشاء الفاتورة');
      }

      // تحويل الاستجابة إلى blob
      const blob = await response.blob();

      // إنشاء رابط تحميل
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // تحديد اسم الملف
      const orderDate = new Date();
      const invoiceNumber = `INV-${orderDate.getFullYear()}${String(orderDate.getMonth() + 1).padStart(2, '0')}-${orderId.slice(-6).toUpperCase()}`;
      link.download = `facture-${invoiceNumber}.pdf`;

      // تحميل الملف
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // تنظيف الرابط
      window.URL.revokeObjectURL(url);

      toast({
        title: 'تم إنشاء الفاتورة',
        description: 'تم إنشاء وتحميل فاتورة PDF بنجاح.',
        variant: 'default',
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({
        title: 'خطأ في إنشاء الفاتورة',
        description: 'حدث خطأ أثناء إنشاء فاتورة PDF. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Confirmation':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Delivered':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'Pending Confirmation':
        return 'في انتظار التأكيد';
      case 'Confirmed':
        return 'مؤكد';
      case 'Delivered':
        return 'تم التوصيل';
      case 'Cancelled':
        return 'ملغي';
      default:
        return status;
    }
  };

  const canConfirm = currentStatus === 'Pending Confirmation';
  const canCancel = !['Delivered', 'Cancelled'].includes(currentStatus);
  const canMarkProcessing = currentStatus === 'Confirmed';
  const canMarkShipped = currentStatus === 'Processing';
  const canMarkDelivered = currentStatus === 'Shipped';
  const canGeneratePDF = !['Cancelled'].includes(currentStatus); // Pas de facture pour les commandes annulées

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <CheckCircle className='w-5 h-5' />
          إجراءات الطلب
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Current Status */}
        <div>
          <p className='text-sm text-gray-600 mb-2'>الحالة الحالية:</p>
          <Badge className={getStatusColor(currentStatus)}>{getStatusText(currentStatus)}</Badge>
        </div>

        {/* PDF Generation - Only for non-cancelled orders */}
        {canGeneratePDF && (
          <div>
            <Button
              onClick={generatePDF}
              disabled={isGeneratingPDF}
              className='w-full bg-purple-600 hover:bg-purple-700 text-white'
            >
              {isGeneratingPDF ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  جاري إنشاء الفاتورة...
                </>
              ) : (
                <>
                  <Download className='w-4 h-4 mr-2' />
                  تحميل فاتورة PDF
                </>
              )}
            </Button>
          </div>
        )}

        {/* Message for cancelled orders */}
        {currentStatus === 'Cancelled' && (
          <div className='p-3 bg-gray-50 border border-gray-200 rounded-lg'>
            <p className='text-gray-600 text-sm text-center'>
              📋 لا يمكن إنشاء فاتورة للطلبات الملغاة
              <br />
              <span className='text-xs'>Aucune facture disponible pour les commandes annulées</span>
            </p>
          </div>
        )}

        {/* Actions */}
        <div className='grid grid-cols-1 gap-3'>
          {/* Confirm Order */}
          {canConfirm && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className='w-full bg-green-600 hover:bg-green-700 text-white' disabled={isConfirming}>
                  {isConfirming ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      جاري التأكيد...
                    </>
                  ) : (
                    <>
                      <CheckCircle className='w-4 h-4 mr-2' />
                      تأكيد الطلب
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الطلب</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من تأكيد هذا الطلب؟ سيتم إشعار العميل وتغيير حالة الطلب إلى "مؤكد".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={confirmOrder}>تأكيد</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Mark as Processing (emballé) */}
          {canMarkProcessing && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className='w-full bg-amber-600 hover:bg-amber-700 text-white' disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <Package className='w-4 h-4 mr-2' />
                      بدء التحضير (التغليف)
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد بدء التحضير</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم تغيير حالة الطلب إلى "قيد التحضير".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => {
                    setIsUpdatingStatus(true);
                    try {
                      const r = await fetch('/api/admin/orders/update-status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId, status: 'Processing' }),
                      });
                      if (!r.ok) throw new Error('فشل في التحديث');
                      toast({ title: 'تم التحديث', description: 'تم تعيين الحالة إلى قيد التحضير.' });
                      router.refresh();
                    } catch (e) {
                      toast({ title: 'خطأ في التحديث', description: 'تعذر تحديث الحالة.', variant: 'destructive' });
                    } finally {
                      setIsUpdatingStatus(false);
                    }
                  }}>تأكيد</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Mark as Shipped */}
          {canMarkShipped && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className='w-full bg-indigo-600 hover:bg-indigo-700 text-white' disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <Truck className='w-4 h-4 mr-2' />
                      تم الشحن
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد الشحن</AlertDialogTitle>
                  <AlertDialogDescription>
                    سيتم تغيير حالة الطلب إلى "تم الشحن".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={async () => {
                    setIsUpdatingStatus(true);
                    try {
                      const r = await fetch('/api/admin/orders/update-status', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ orderId, status: 'Shipped' }),
                      });
                      if (!r.ok) throw new Error('فشل في التحديث');
                      toast({ title: 'تم التحديث', description: 'تم تعيين الحالة إلى تم الشحن.' });
                      router.refresh();
                    } catch (e) {
                      toast({ title: 'خطأ في التحديث', description: 'تعذر تحديث الحالة.', variant: 'destructive' });
                    } finally {
                      setIsUpdatingStatus(false);
                    }
                  }}>تأكيد</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Mark as Delivered */}
          {canMarkDelivered && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button className='w-full bg-blue-600 hover:bg-blue-700 text-white' disabled={isUpdatingStatus}>
                  {isUpdatingStatus ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      جاري التحديث...
                    </>
                  ) : (
                    <>
                      <Truck className='w-4 h-4 mr-2' />
                      تم التوصيل
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>تأكيد التوصيل</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل تم توصيل هذا الطلب للعميل؟ سيتم تغيير حالة الطلب إلى "تم التوصيل".
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={markAsDelivered}>تأكيد التوصيل</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {/* Cancel Order */}
          {canCancel && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive' className='w-full' disabled={isCancelling}>
                  {isCancelling ? (
                    <>
                      <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                      جاري الإلغاء...
                    </>
                  ) : (
                    <>
                      <XCircle className='w-4 h-4 mr-2' />
                      إلغاء الطلب
                    </>
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>إلغاء الطلب</AlertDialogTitle>
                  <AlertDialogDescription>
                    هل أنت متأكد من إلغاء هذا الطلب؟ هذا الإجراء لا يمكن التراجع عنه وسيتم إشعار العميل.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>إلغاء</AlertDialogCancel>
                  <AlertDialogAction onClick={cancelOrder} className='bg-red-600 hover:bg-red-700'>
                    إلغاء الطلب
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>

        {/* Status Info */}
        {currentStatus === 'Delivered' && (
          <div className='p-3 bg-blue-50 border border-blue-200 rounded-lg'>
            <p className='text-blue-800 text-sm'>✅ تم توصيل هذا الطلب بنجاح</p>
          </div>
        )}

        {currentStatus === 'Cancelled' && (
          <div className='p-3 bg-red-50 border border-red-200 rounded-lg'>
            <p className='text-red-800 text-sm'>❌ تم إلغاء هذا الطلب</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
