'use client';
import { ClientDataTable } from '@/components/ClientDataTable';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useSession } from '@/context/SessionProvider'; // Assuming this path
import { Database } from '@/types/supabase';
import { deleteOrder } from '@/actions/checkoutActions';
import OrderActions from '@/components/OrderActions'; // Import the new component

type Order = Database['public']['Tables']['orders']['Row'] & {
  customers: { first_name: string; last_name: string } | null;
  shipping_address: Database['public']['Tables']['addresses']['Row'] | null;
};

type CustomerInfo = Order['customers'];
type AddressWithPhone = Order['shipping_address'];
'use client';
import { DataTable } from '@/components/data-table';



export default function OrderPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();
  const { supabase, session } = useSession();

  const fetchOrders = async () => {
    setLoading(true);
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*, customers(first_name, last_name), shipping_address:addresses(*)', { count: 'exact', head: false });

    if (ordersError) {
      console.error('Error fetching orders:', ordersError.message || JSON.stringify(ordersError));
    } else {
      setOrders(ordersData || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const orderColumns = [
    {
      id: 'customer_phone',
      accessorKey: 'shipping_address',
      header: 'Phone',
      cell: ({ row }: { row: { original: Order } }) => row.original.shipping_address?.phone_number || ''
    },
    {
      accessorKey: 'customers',
      header: 'Customer',
      cell: ({ row }: { row: { original: Order } }) => {
        const customer = row.original.customers;
        return customer ? `${customer.first_name} ${customer.last_name}` : '';
      }
    },
    {
      id: 'total_amount',
      accessorKey: 'total_amount',
      header: 'Amount',
      cell: ({ row }: { row: { original: Order } }) => `${row.original.total_amount.toFixed(2)}`
    },
    {
      id: 'actions',
      header: 'Actions',
      cell: ({ row }: { row: { original: Order } }) => (
        <OrderActions order={row.original} fetchOrders={fetchOrders} />
      )
    }
  ];

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Orders</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <ClientDataTable columns={orderColumns} data={orders} />
      )}
    </div>
  );
}
