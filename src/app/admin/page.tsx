// src/app/admin/page.tsx
import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import { Database } from '@/types/supabase'; // Adjusted to use absolute path alias

// --- Icônes pour les cartes (optionnel, exemple avec lucide-react) ---
import { Users, Package, Tags, ShoppingCart, DollarSign } from 'lucide-react';

// --- Composant Carte Statistique ---
interface StatCardProps {
  title: string;
  value: string | number;
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
// Adaptez les types en fonction de votre table 'orders'
interface Order {
  id: number; // ou string si UUID
  created_at: string;
  // Adaptez selon votre schema: user_id, customer_email, total_price, status etc.
  customer_identifier?: string; // Exemple: email ou ID client
  total?: number;
  status?: string;
}

function RecentOrdersTable({ orders }: { orders: Order[] }) {
    if (!orders || orders.length === 0) {
        return <p className="text-gray-500 mt-4">No recent orders found.</p>;
    }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mt-8">
      <h2 className="text-xl font-semibold mb-4 text-gray-800">Recent Orders</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{order.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.created_at).toLocaleDateString()} {/* Formatage simple */}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.customer_identifier || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{order.total !== undefined ? `$${order.total.toFixed(2)}` : 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
  const cookieStore = cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {  cookies: {
      get: (name: string) => cookieStore.get(name)?.value,
      set: () => {},    // Pas besoin de set/remove côté serveur pour SSR simple
      remove: () => {},
    } }
  );


  // --- Récupération des données ---
  // ATTENTION: Adaptez les noms de tables ('products', 'categories', 'orders', 'profiles' ou 'customers')
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

  // Nombre de Clients (Utilisateurs authentifiés)
  // Pour Supabase Auth, c'est un peu différent
  const { data: usersData, error: usersError } = await supabase.auth.admin.listUsers();
  const customerCount = usersData?.users?.length ?? 0; // Nombre total d'utilisateurs

   // Commandes Récentes (Exemple: 5 dernières)
   const { data: recentOrders, error: recentOrdersError } = await supabase
   .from('orders') // <- Adaptez le nom de la table
   .select('id, created_at, customer_identifier, total, status') // <- Adaptez les colonnes nécessaires
   .order('created_at', { ascending: false })
   .limit(5);

  // Gestion basique des erreurs (vous pouvez améliorer ceci)
  if (productError || categoryError || orderError || usersError || recentOrdersError) {
      console.error("Error fetching dashboard data:", { productError, categoryError, orderError, usersError, recentOrdersError });
      // Afficher un message d'erreur à l'utilisateur pourrait être utile ici
  }

  return (
    // Le layout AdminLayout est appliqué automatiquement
    <div>
      <h1 className="text-3xl font-bold mb-8 text-gray-900">
        Admin Dashboard
      </h1>

      {/* Grille pour les cartes statistiques */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Customers" value={customerCount ?? 'N/A'} icon={Users} />
        <StatCard title="Total Products" value={productCount ?? 'N/A'} icon={Package} />
        <StatCard title="Total Categories" value={categoryCount ?? 'N/A'} icon={Tags} />
        <StatCard title="Total Orders" value={orderCount ?? 'N/A'} icon={ShoppingCart} />
        {/* Ajoutez d'autres cartes si nécessaire (ex: Revenu Total) */}
        {/* <StatCard title="Total Revenue" value="$12,345" icon={DollarSign} /> */}
      </div>

      {/* Tableau des commandes récentes */}
      <RecentOrdersTable orders={recentOrders || []} />

      {/* Vous pouvez ajouter d'autres sections ici */}

    </div>
  );
}