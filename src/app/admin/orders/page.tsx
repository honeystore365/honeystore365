'use client';

// Ce fichier a été déplacé dans src/app/admin/orders/page.tsx

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { DataTable } from '@/components/data-table';
import Link from 'next/link';

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  created_at: string;
}

export default function OrdersPage() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    const { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*');

    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
    } else {
      setOrders(ordersData || []);
    }

    setLoading(false);
  };

  const orderColumns = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'customer_id',
      header: 'Customer ID',
    },
    {
      accessorKey: 'total_amount',
      header: 'Total Amount',
    },
  ];

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-8">Liste des commandes</h1>
      {/* <Link href="/(admin)/admin/orders/new" className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4 inline-block">
        Ajouter une commande
      </Link> */}
      {loading ? (
        <div>Chargement...</div>
      ) : (
        <DataTable columns={orderColumns} data={orders} />
      )}
    </div>
  );
}