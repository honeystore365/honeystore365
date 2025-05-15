'use client';
import { AddressWithPhone } from '@/actions/checkoutActions';

// Ce fichier a été déplacé dans src/app/admin/orders/page.tsx

import { useEffect, useState } from 'react';
import { useSession } from '../../../context/SessionProvider';
import { DataTable } from '@/components/data-table';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { deleteOrder } from '@/actions/checkoutActions';
import { Session } from '@supabase/supabase-js';

interface CustomerInfo {
  first_name: string | null;
  last_name: string | null;
}

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  order_date: string; // Change from created_at to order_date
  customers: CustomerInfo | null;
  customer_email: string | null;
  shipping_address_id: string | null;
  shipping_address: AddressWithPhone | null; // Add the nested shipping_address property
}

interface OrdersPageProps {
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);
  const { toast } = useToast();
  const { supabase, session } = useSession(); // Call useSession at the top level

  const fetchOrders = async () => {
    setLoading(true);
    // Use supabase client from session context
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*, customers(first_name, last_name), addresses(*)', { count: 'exact', head: false }) // Fetch all fields from the related addresses table
;

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
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
      id: 'customer_phone', // Keep unique id
      accessorKey: 'shipping_address', // Change accessorKey to shipping_address
      header: 'رقم هاتف العميل', // Keep header
      cell: ({ row }: { row: { original: Order } }) => {
        const address = row.original.shipping_address; // Access the nested address object
        return address?.phone_number || '\u00A0'; // Display phone number or non-breaking space
      },
    },
    {
      accessorKey: 'customers',
      header: 'اسم العميل',
      cell: ({ row }: { row: { original: Order } }) => {
        const customer = row.original.customers; // Access the nested customer object
        console.log('Customer data for order:', row.original.id, customer); // Add console log
        const fullName = customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : '';
        return fullName || '\u00A0'; // Render non-breaking space if fullName is empty
      },
    },
    {
      id: 'shipping_address_formatted', // Keep unique id
      accessorKey: 'shipping_address_id', // Access the shipping_address_id
      header: 'عنوان الشحن', // Keep header
      cell: ({ row }: { row: { original: Order } }) => {
        const addressId = row.original.shipping_address_id; // Get the address ID
        const [address, setAddress] = useState<AddressWithPhone | null>(null);
        const [loadingAddress, setLoadingAddress] = useState(true);
        const { supabase } = useSession(); // Access supabase client

        useEffect(() => {
          const fetchAddress = async () => {
            if (!addressId) {
              setAddress(null);
              setLoadingAddress(false);
              return;
            }
            const { data, error } = await supabase
              .from('addresses')
              .select('*')
              .eq('id', addressId)
              .single();

            if (error) {
              console.error(`Error fetching address for ID ${addressId}:`, error);
              setAddress(null);
            } else {
              setAddress(data as AddressWithPhone);
            }
            setLoadingAddress(false);
          };
          fetchAddress();
        }, [addressId, supabase]); // Rerun if addressId or supabase changes

        if (loadingAddress) return 'Loading...';
        if (!address) return '\u00A0';

        // Format the address for display
        const formattedAddress = `${address.address_line_1 || ''}, ${address.city || ''}, ${address.country || ''}`;
        return formattedAddress.trim() || '\u00A0';
      },
    },
    {
      accessorKey: 'total_amount',
      header: 'المبلغ الإجمالي (د.ت)',
      cell: ({ row }: { row: { original: Order } }) => {
        return `${row.original.total_amount.toFixed(2)} د.ت`;
      },
    },
    {
      accessorKey: 'order_date', // Change from created_at to order_date
      header: 'تاريخ الطلب', // Keep header
      cell: ({ row }: { row: { original: Order } }) => {
        const date = new Date(row.original.order_date); // Use order_date
        return date.toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      },
    },
    {
      id: 'actions',
      header: 'الإجراءات',
      cell: ({ row }: { row: { original: Order } }) => {
        const order = row.original;

        const handleValidate = async () => {
          console.log('Validate button clicked for order:', order.id);
          console.log('Sending orderId to API:', order.id);
          try {
            const response = await fetch('/api/generate-invoice', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ orderId: order.id }),
            });

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to generate PDF on server.');
            }

            // Get the filename from the Content-Disposition header
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `invoice-${order.id}.pdf`; // Default filename
            if (contentDisposition) {
              const filenameMatch = contentDisposition.match(/filename="(.+)"/);
              if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1];
              }
            }

            // Create a blob from the response and trigger download
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            window.open(url, '_blank'); // Open in a new tab
            window.URL.revokeObjectURL(url); // Clean up the temporary URL

            fetchOrders(); // Refresh the orders list

            console.log(`PDF generated and downloaded for order ${order.id}`);
            toast({
              title: "تم التحقق بنجاح",
              description: `تم إنشاء وتنزيل فاتورة PDF للطلب ${order.id}.`,
              variant: "default",
            });
          } catch (error: any) {
            console.error(`Error validating order ${order.id}:`, error);
            toast({
              title: "خطأ في التحقق",
              description: `فشل في إنشاء الفاتورة للطلب ${order.id}: ${error.message}`,
              variant: "destructive",
            });
          }
        };

        const handleCancel = async () => {
          console.log('Cancel button clicked for order:', order.id);
          const { success, error } = await deleteOrder(order.id);

          if (error) {
            console.error(`Error cancelling order ${order.id}:`, error);
            toast({
              title: "خطأ في الإلغاء",
              description: `فشل في إلغاء الطلب ${order.id}: ${error}`,
              variant: "destructive",
            });
          } else {
            console.log(`Order ${order.id} cancelled successfully.`);
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
            <button onClick={handleValidate} className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded text-sm">
              تحقق
            </button>
            <button onClick={handleCancel} className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded text-sm">
              إلغاء
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">قائمة الطلبات</h1>
      {/* <Link href="/(admin)/admin/orders/new" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4 inline-block">
        Ajouter une commande
      </Link> */}
      {loading ? (
        <div>جاري التحميل...</div>
      ) : (
        <DataTable columns={orderColumns} data={orders} />
      )}
    </div>
  );
}
