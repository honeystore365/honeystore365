'use client';
'use client';

import { useToast } from '@/hooks/use-toast';
import { deleteOrder } from '@/actions/checkoutActions';
import { Database } from '@/types/supabase';

type Order = Database['public']['Tables']['orders']['Row'] & {
  customers: { first_name: string; last_name: string } | null;
  shipping_address: Database['public']['Tables']['addresses']['Row'] | null;
};

type OrderActionsProps = {
  order: Order;
  fetchOrders: () => void;
};

export default function OrderActions({ order, fetchOrders }: OrderActionsProps) {
  const { toast } = useToast();

  const handleValidate = async () => {
    try {
      const response = await fetch('/api/validate-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id })
      });
      if (!response.ok) throw new Error('Validation failed');
      fetchOrders();
      toast({ title: 'Order validated', variant: 'default' });
    } catch (error: any) {
      toast({ title: 'Validation error', description: error.message, variant: 'destructive' });
    }
  };

  const handleCancel = async () => {
    const { error } = await deleteOrder(order.id);
    if (error) {
      toast({ title: 'Cancel failed', description: (error as any)?.message || 'An unknown error occurred', variant: 'destructive' });
    } else {
      fetchOrders();
      toast({ title: 'Order cancelled', variant: 'default' });
    }
  };

  return (
    <div className="flex space-x-2">
      <button
        onClick={handleValidate}
        className="bg-blue-500 text-white px-3 py-1 rounded"
      >
        Validate
      </button>
      <button
        onClick={handleCancel}
        className="bg-red-500 text-white px-3 py-1 rounded"
      >
        Cancel
      </button>
    </div>
  );
}