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
import { AlertTriangle, CheckCircle, FileText, Loader2, Package, Truck, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

interface AdminOrderActionsProps {
  orderId: string;
  currentStatus: string;
}

export default function AdminOrderActions({ orderId, currentStatus }: AdminOrderActionsProps) {
  const [isConfirming, setIsConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

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

      // Refresh the page to show updated status
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

      // Redirect back to orders list
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

  const generateInvoicePDF = async () => {
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
        throw new Error('فشل في إنشاء الفاتورة');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `invoice-${orderId.slice(-8)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
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
        description: 'حدث خطأ أثناء إنشاء الفاتورة. يرجى المحاولة مرة أخرى.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const updateOrderStatus = async (newStatus: string) => {
    setIsUpdatingStatus(true);

    try {
      const response = await fetch('/api/admin/orders/update-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ orderId, status: newStatus }),
      });

      if (!response.ok) {
        throw new Error('فشل في تحديث حالة الطلب');
      }

      toast({
        title: 'تم تحديث الحالة',
        description: 'تم تحديث حالة الطلب بنجاح.',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Pending Confirmation':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'Confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Processing':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'Shipped':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Delivered':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'Cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const canConfirm = currentStatus === 'Pending Confirmation';
  const canCancel = !['Delivered', 'Cancelled'].includes(currentStatus);
  const canProcess = currentStatus === 'Confirmed';
  const canShip = currentStatus === 'Processing';

  return (
    <Card>
      <CardHeader>
        <CardTitle className='flex items-center gap-2'>
          <AlertTriangle className='w-5 h-5' />
          إجراءات الطلب
        </CardTitle>
      </CardHeader>
      <CardContent className='space-y-4'>
        {/* Current Status */}
        <div>
          <p className='text-sm text-gray-600 mb-2'>الحالة الحالية:</p>
          <Badge className={getStatusColor(currentStatus)}>
            {currentStatus === 'Pending Confirmation' && 'في انتظار التأكيد'}
            {currentStatus === 'Confirmed' && 'مؤكد'}
            {currentStatus === 'Processing' && 'قيد التحضير'}
            {currentStatus === 'Shipped' && 'تم الشحن'}
            {currentStatus === 'Delivered' && 'تم التوصيل'}
            {currentStatus === 'Cancelled' && 'ملغي'}
          </Badge>
        </div>

        {/* Primary Actions */}
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

          {/* Process Order */}
          {canProcess && (
            <Button
              onClick={() => updateOrderStatus('Processing')}
              className='w-full bg-blue-600 hover:bg-blue-700 text-white'
              disabled={isUpdatingStatus}
            >
              {isUpdatingStatus ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  جاري التحديث...
                </>
              ) : (
                <>
                  <Package className='w-4 h-4 mr-2' />
                  بدء التحضير
                </>
              )}
            </Button>
          )}

          {/* Ship Order */}
          {canShip && (
            <Button
              onClick={() => updateOrderStatus('Shipped')}
              className='w-full bg-purple-600 hover:bg-purple-700 text-white'
              disabled={isUpdatingStatus}
            >
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
          )}

          {/* Generate PDF Invoice - Only available after confirmation */}
          {['Confirmed', 'Processing', 'Shipped', 'Delivered'].includes(currentStatus) && (
            <Button onClick={generateInvoicePDF} variant='outline' className='w-full' disabled={isGeneratingPDF}>
              {isGeneratingPDF ? (
                <>
                  <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                  جاري إنشاء الفاتورة...
                </>
              ) : (
                <>
                  <FileText className='w-4 h-4 mr-2' />
                  إنشاء فاتورة PDF
                </>
              )}
            </Button>
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

        {/* Status Update Options */}
        {currentStatus === 'Shipped' && (
          <Button
            onClick={() => updateOrderStatus('Delivered')}
            className='w-full bg-green-600 hover:bg-green-700 text-white'
            disabled={isUpdatingStatus}
          >
            {isUpdatingStatus ? (
              <>
                <Loader2 className='w-4 h-4 mr-2 animate-spin' />
                جاري التحديث...
              </>
            ) : (
              <>
                <CheckCircle className='w-4 h-4 mr-2' />
                تم التوصيل
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
