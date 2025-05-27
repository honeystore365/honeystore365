'use client';

import { useToast } from '@/hooks/use-toast';
import { Database } from '@/types/supabase';
import { deleteOrder } from '@/actions/checkoutActions';

type Order = Database['public']['Tables']['orders']['Row'] & {
  customers: { first_name: string; last_name: string } | null;
  shipping_address: Database['public']['Tables']['addresses']['Row'] | null;
};

const DataTableActions = ({ order, fetchOrders, toast }: { order: Order; fetchOrders: () => void; toast: ReturnType<typeof useToast>['toast'] }) => {
  const handleValidate = async (order: Order) => {
    try {
      const response = await fetch('/api/generate-invoice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id }),
      });

      if (!response.ok) throw new Error('Failed to generate PDF');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      window.open(url, '_blank');
      window.URL.revokeObjectURL(url);
      fetchOrders();

      toast({
        title: "تم التحقق بنجاح",
        description: `تم إنشاء وتنزيل فاتورة PDF للطلب ${order.id}.`,
        variant: "default",
      });
    } catch (error: any) {
      toast({
        title: "خطأ في التحقق",
        description: `فشل في إنشاء الفاتورة للطلب ${order.id}: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (order: Order) => {
    const { success, error } = await deleteOrder(order.id);
    if (error) {
      toast({
        title: "خطأ في الإلغاء",
        description: `فشل في إلغاء الطلب ${order.id}: ${error}`,
        variant: "destructive",
      });
    } else {
      fetchOrders();
      toast({
        title: "تم الإلغاء بنجاح",
        description: `تم إلغاء الطلب ${order.id}.`,
        variant: "default",
      });
    }
  };

  return (
    <div className="flex space-x-2">
      <button onClick={() => handleValidate(order)} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm">
        تحقق
      </button>
      <button onClick={() => handleCancel(order)} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm">
        إلغاء
      </button>
    </div>
  );
};

export default DataTableActions;