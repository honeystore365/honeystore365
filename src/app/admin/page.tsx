'use client';

import { useState, useEffect, useTransition } from 'react';
import { createClient } from '@/lib/supabaseClient';
import { Database } from '@/types/supabase';
import { setRecentOrdersCookie } from '@/actions/adminActions';
import { getRecentOrdersCookie } from '@/actions/cookieActions';
// --- Icônes pour les cartes (optionnel, exemple avec lucide-react) ---
import { Users, Package, Tags, ShoppingCart, DollarSign } from 'lucide-react';

// --- Composant Carte Statistique ---
interface StatCardProps {
  title: string;
  value: string | number | undefined; // Allow undefined for loading/error states
  icon: React.ElementType;
  bgColor?: string; // Optionnel pour couleur de fond
}

function StatCard({ title, value, icon: Icon, bgColor = 'bg-white' }: StatCardProps) {
  return (
    <div className={`${bgColor} p-6 rounded-lg shadow-md flex items-center space-x-4`}>
      <div className="p-3 bg-gray-100 rounded-full">
        <Icon className="h-6 w-6 text-gray-600" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

// --- Composant Tableau Commandes Récentes ---
// Adaptez les types en fonction de votre table 'orders' - Use actual column names
interface Order {
  id: string; // uuid
  order_date: string; // timestamp with time zone
  customer_id?: string | null | undefined; // Assuming this exists for customer identifier
  total_amount?: number; // Use actual column name
  customers: { first_name: string | null; last_name: string | null } | null; // Include customer names
}

import React from 'react';

const RecentOrdersTable = React.memo(function RecentOrdersTable({ orders }: { orders: Order[] }) {
  console.log("RecentOrdersTable rendered with orders:", orders);
  if (!orders || orders.length === 0) {
    return <p className="text-gray-500 mt-4">لم يتم العثور على طلبات حديثة.</p>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">الطلبات الأخيرة</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                #
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                معرف الطلب
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                التاريخ
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                العميل
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                المجموع
              </th>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                الحالة
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order, index) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {index + 1}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                  {order.id}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {new Date(order.order_date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {order.customers && order.customers !== null
                    ? `${order.customers.first_name || ''} ${order.customers.last_name || ''}`.trim()
                    : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {order.total_amount !== undefined ? `$${order.total_amount.toFixed(2)}` : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  N/A
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
});
// --- Page Principale du Dashboard ---
export default function AdminPage() {
  console.log("AdminPage rendered");
  const [isPending, startTransition] = useTransition();
  const [recentOrders, setRecentOrders] = useState<Order[] | null>(null);
  const [recentOrdersError, setRecentOrdersError] = useState<any>(null);
  const supabase = createClient();
  
  const [productCount, setProductCount] = useState<number | undefined>(undefined);
  const [categoryCount, setCategoryCount] = useState<number | undefined>(undefined);
  const [orderCount, setOrderCount] = useState<number | undefined>(undefined);
  const [customerCount, setCustomerCount] = useState<number | undefined>(undefined);

  useEffect(() => {
    console.log("useEffect in AdminPage ran");
    const fetchOrders = async () => {
      let productCountData: number | null = null;
      let productErrorData: any = null;
      let categoryCountData: number | null = null;
      let categoryErrorData: any = null;
      let orderCountData: number | null = null;
      let orderErrorData: any = null;
      let customerRpcErrorData: any = null;
      let nonAdminCustomers: any[] | null = null;
      
      try {
        const productResult = await supabase
          .from('products')
          .select('*', { count: 'exact', head: true });
        productCountData = productResult.count;
        productErrorData = productResult.error;

        const categoryResult = await supabase
          .from('categories')
          .select('*', { count: 'exact', head: true });
        categoryCountData = categoryResult.count;
        categoryErrorData = categoryResult.error;

        const orderResult = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });
        orderCountData = orderResult.count;
        orderErrorData = orderResult.error;

        const customerRpcResult: any = await supabase.rpc('get_non_admin_customers');
        nonAdminCustomers = (customerRpcResult?.data) as {first_name: string | null, last_name: string | null}[];
        customerRpcErrorData = customerRpcResult.error;

        const cachedOrders = await getRecentOrdersCookie();
        if (cachedOrders) {
          setRecentOrders(JSON.parse(cachedOrders));
          setRecentOrdersError(null);
          console.log('Using cached orders:', JSON.parse(cachedOrders));
        } else {
          const { data, error } = await supabase
            .from('orders')
            .select('id, order_date, customer_id, total_amount, customers(first_name, last_name)')
            .order('order_date', { ascending: true })
            .limit(5) as { data: Order[] | null, error: any };

          if (data) {
            console.log("useEffect - data before setRecentOrders:", data);
            setRecentOrders(data);
            setRecentOrdersError(null);
            startTransition(() => {
              setRecentOrdersCookie(data);
            });
            console.log('Caching orders:', data);
          } else {
            setRecentOrdersError(error);
          }
        }
      } catch (error: any) {
        console.error("Error fetching data:", error);
      } finally {
        setProductCount(productCountData ?? undefined);
        setCategoryCount(categoryCountData ?? undefined);
        setOrderCount(orderCountData ?? undefined);
        setCustomerCount(nonAdminCustomers?.length ?? undefined);
      }
    };

    fetchOrders();
  }, [supabase, startTransition]);

  const typedRecentOrders: Order[] = (recentOrders as any) as Order[];

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        لوحة تحكم المشرف
      </h1>

      {/* Grille pour les cartes statistiques */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {/* Use customerCount from RPC */}
        <StatCard title="إجمالي العملاء" value={customerCount ?? 'N/A'} icon={Users} />
        <StatCard title="إجمالي المنتجات" value={productCount ?? 'N/A'} icon={Package} />
        <StatCard title="إجمالي الفئات" value={categoryCount ?? 'N/A'} icon={Tags} />
        <StatCard title="إجمالي الطلبات" value={orderCount ?? 'N/A'} icon={ShoppingCart} />
        {/* Ajoutez d'autres cartes si nécessaire (ex: Revenu Total) */}
      </div>

      {/* Tableau des commandes الأخيرة */}
      <RecentOrdersTable orders={typedRecentOrders || []} />

      {/* Vous pouvez ajouter d'autres sections ici */}
    </div>
  );
}
