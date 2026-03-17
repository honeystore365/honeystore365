"use client";

import { db } from "@/lib/db";
import { Package, ShoppingCart, Users, TrendingUp, DollarSign, Activity } from "lucide-react";
import Link from "next/link";

export default function AdminDashboardPage() {
  // Real-time queries - all data updates automatically!
  const { isLoading, error, data } = db.useQuery({
    products: {},
    orders: {
      $: {
        order: { orderDate: "desc" },
      },
      customer: {},
      items: {
        product: {},
      },
    },
    categories: {},
  });

  const { data: usersData } = db.useQuery({ $users: {} });

  if (isLoading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
        Erreur: {error.message}
      </div>
    );
  }

  const { products, orders, categories } = data;
  const users = usersData?.$users || [];

  // Calculate stats
  const totalRevenue = orders
    .filter((o) => !["pending", "cancelled"].includes(o.status))
    .reduce((sum, o) => sum + o.grandTotal, 0);

  const pendingOrders = orders.filter((o) => o.status === "pending").length;
  const activeProducts = products.filter((p) => p.isAvailable).length;
  const lowStockProducts = products.filter((p) => p.stock < 5).length;

  // Recent orders (last 5)
  const recentOrders = orders.slice(0, 5);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1">
          Vue d'ensemble de votre boutique en temps réel
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Chiffre d'affaires"
          value={`${(totalRevenue / 1000).toFixed(3)} DT`}
          icon={DollarSign}
          trend="+12% ce mois"
          color="amber"
        />
        <StatCard
          title="Commandes"
          value={orders.length.toString()}
          icon={ShoppingCart}
          trend={`${pendingOrders} en attente`}
          color="blue"
        />
        <StatCard
          title="Produits"
          value={products.length.toString()}
          icon={Package}
          trend={`${activeProducts} actifs`}
          color="green"
        />
        <StatCard
          title="Clients"
          value={users.length.toString()}
          icon={Users}
          trend="+3 ce mois"
          color="purple"
        />
      </div>

      {/* Alerts */}
      {lowStockProducts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-8">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-amber-600" />
            <div>
              <p className="font-medium text-amber-800">
                Stock faible
              </p>
              <p className="text-sm text-amber-700">
                {lowStockProducts} produit(s) ont moins de 5 unités en stock.{" "}
                <Link href="/admin/products" className="underline">
                  Voir les produits
                </Link>
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold">Commandes récentes</h2>
              <Link
                href="/admin/orders"
                className="text-amber-600 hover:text-amber-700 text-sm font-medium"
              >
                Voir tout →
              </Link>
            </div>
          </div>
          <div className="divide-y divide-gray-200">
            {recentOrders.map((order) => (
              <div key={order.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-medium">
                    #{order.id.slice(-8).toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-500">
                    {order.customer?.name || order.customer?.email || "Client"} •{" "}
                    {order.items?.length || 0} article(s)
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-amber-600">
                    {(order.grandTotal / 1000).toFixed(3)} DT
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(order.orderDate).toLocaleDateString("fr-TN")}
                  </p>
                </div>
              </div>
            ))}
            {recentOrders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                Aucune commande pour le moment
              </div>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Actions rapides</h2>
          </div>
          <div className="p-6 space-y-3">
            <QuickAction
              href="/admin/products"
              icon={Package}
              title="Gérer les produits"
              description="Ajouter, modifier ou supprimer des produits"
            />
            <QuickAction
              href="/admin/orders"
              icon={ShoppingCart}
              title="Traiter les commandes"
              description={`${pendingOrders} commande(s) en attente de traitement`}
            />
            <QuickAction
              href="/admin/categories"
              icon={TrendingUp}
              title="Organiser les catégories"
              description={`${categories.length} catégorie(s) configurées`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  color,
}: {
  title: string;
  value: string;
  icon: typeof Package;
  trend: string;
  color: string;
}) {
  const colorClasses: Record<string, string> = {
    amber: "bg-amber-50 text-amber-600",
    blue: "bg-blue-50 text-blue-600",
    green: "bg-green-50 text-green-600",
    purple: "bg-purple-50 text-purple-600",
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500 mt-2">{trend}</p>
        </div>
        <div className={`w-12 h-12 rounded-lg flex items-center justify-center ${colorClasses[color]}`}>
          <Icon className="w-6 h-6" />
        </div>
      </div>
    </div>
  );
}

function QuickAction({
  href,
  icon: Icon,
  title,
  description,
}: {
  href: string;
  icon: typeof Package;
  title: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:border-amber-300 hover:bg-amber-50 transition-colors"
    >
      <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
        <Icon className="w-5 h-5 text-amber-600" />
      </div>
      <div className="flex-1">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
    </Link>
  );
}
