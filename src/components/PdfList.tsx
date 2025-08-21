"use client";

import { useEffect, useState } from 'react';
import { createClientComponent } from '@/lib/supabaseClient';

interface Order {
  id: string;
  pdf_url: string | null;
  order_date: string;
}

const PdfList = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const supabase = createClientComponent();

  useEffect(() => {
    const fetchOrders = async () => {
      const { data, error } = await supabase
        .from('orders')
        .select('id, pdf_url, order_date')
        .not('pdf_url', 'is', null);

      if (error) {
        console.error('Error fetching orders:', error);
        return;
      }

      setOrders(data as Order[]);
    };

    fetchOrders();
  }, [supabase]);

  return (
    <div>
      <h2>Generated Invoices</h2>
      {orders.length === 0 ? (
        <p>No invoices generated yet.</p>
      ) : (
        <ul>
          {orders.map((order) => (
            <li key={order.id}>
              Invoice for order {order.id} ({new Date(order.order_date).toLocaleDateString()}) :
              {order.pdf_url ? (
                <a href={order.pdf_url} target="_blank" rel="noopener noreferrer">
                  Download PDF
                </a>
              ) : (
                <span>Generating...</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default PdfList;
