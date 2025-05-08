// src/app/admin/page.tsx
import { cookies } from 'next/headers';
import { createClientServer } from '@/lib/supabaseClientServer';
import { Database } from '@/types/supabase'; // Adjusted to use absolute path alias

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
  customer_id?: string; // Assuming this exists for customer identifier
  total_amount?: number; // Use actual column name
  status?: string; // Assuming status column exists
}

function RecentOrdersTable({ orders }: { orders: Order[] }) {
    if (!orders || orders.length === 0) {
        return <p className="text-gray-500 mt-4">لم يتم العثور على طلبات حديثة.</p>; // Translated
    }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">الطلبات الأخيرة</h2> {/* Translated */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">معرف الطلب</th> {/* Translated */}
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">التاريخ</th> {/* Translated */}
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">العميل</th> {/* Translated */}
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">المجموع</th> {/* Translated */}
              <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">الحالة</th> {/* Translated */}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {new Date(order.order_date).toLocaleDateString()} {/* Use order_date */}
                </td>
                {/* Assuming customer_id exists and needs fetching related customer name/email */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{order.customer_id || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">{order.total_amount !== undefined ? `$${order.total_amount.toFixed(2)}` : 'N/A'}</td> {/* Use total_amount */}
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right">
                  {/* Style simple pour le statut */}
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    order.status === 'Completed' ? 'bg-green-100 text-green-800' :
                    order.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                    order.status === 'Cancelled' ? 'bg-red-100 text-red-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {order.status || 'N/A'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


// --- Page Principale du Dashboard ---
export default async function AdminPage() {
  const supabase = await createClientServer(); // Use standard server client - Added await


  // --- Récupération des données ---
  // ATTENTION: Adaptez les noms de tables ('products', 'categories', 'orders', 'customers')
  // et les colonnes selon VOTRE schéma exact !

  // Nombre de Produits
  const { count: productCount, error: productError } = await supabase
    .from('products') // <- Adaptez le nom de la table
    .select('*', { count: 'exact', head: true });

  // Nombre de Catégories
  const { count: categoryCount, error: categoryError } = await supabase
    .from('categories') // <- Adaptez le nom de la table
    .select('*', { count: 'exact', head: true });

  // Nombre de Commandes
  const { count: orderCount, error: orderError } = await supabase
    .from('orders') // <- Adaptez le nom de la table
    .select('*', { count: 'exact', head: true });

  // Nombre de Clients (Non-Admin) using RPC
  const { data: nonAdminCustomers, error: customerRpcError } = await supabase.rpc('get_non_admin_customers');
  const customerCount = nonAdminCustomers?.length; // Count non-admin customers
  // Note: Handle customerRpcError if needed

   // Commandes Récentes (Exemple: 5 dernières) - Use correct columns
   const { data: recentOrders, error: recentOrdersError } = await supabase
   .from('orders')
   .select('id, order_date, customer_id, total_amount, status') // Use correct columns
   .order('order_date', { ascending: false }) // Use order_date
   .limit(5);

  // Gestion basique des erreurs (vous pouvez améliorer ceci) - Added customerRpcError
  const errors = { productError, categoryError, orderError, customerRpcError, recentOrdersError };
  let hasError = false;
  for (const key in errors) {
    const errorValue = errors[key as keyof typeof errors];
    if (errorValue) {
      hasError = true;
      // Attempt to log message and details if they exist, otherwise the whole object
      const errorMessage = errorValue.message ? `${errorValue.message}${errorValue.details ? ` (${errorValue.details})` : ''}` : JSON.stringify(errorValue);
      console.error(`Error fetching ${key.replace('Error', '')}:`, errorMessage);
    }
  }

  if (hasError) {
    console.error("Overall dashboard data fetching encountered issues. See details above. Raw error objects:", errors);
    // Afficher un message d'erreur à l'utilisateur pourrait être utile ici,
    // par exemple, en passant un état d'erreur aux composants enfants ou à la page.
  }

  return (
    // Le layout AdminLayout est appliqué automatiquement
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
        {/* <StatCard title="Total Revenue" value="$12,345" icon={DollarSign} /> */}
      </div>

      {/* Tableau des commandes récentes */}
      <RecentOrdersTable orders={recentOrders || []} />

      {/* Vous pouvez ajouter d'autres sections ici */}

    </div>
  );
}
