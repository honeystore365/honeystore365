import { getProducts, getOrders, getCategories, getCustomers } from "@/lib/db";
import { Package, ShoppingCart, Users, DollarSign, TrendingUp, Clock, Tag, Settings } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboard() {
  const [products, orders, categories, customers] = await Promise.all([
    getProducts(),
    getOrders(),
    getCategories(),
    getCustomers()
  ]);

  const totalRevenue = orders.reduce((sum: number, order: any) => sum + (order.total_amount || 0), 0);
  const pendingOrders = orders.filter((o: any) => !o.status || o.status === 'pending').length;

  const stats = [
    {
      title: "إجمالي المنتجات",
      value: products.length,
      icon: Package,
      color: "bg-blue-500",
      bgColor: "bg-blue-50",
      textColor: "text-blue-600"
    },
    {
      title: "الطلبات",
      value: orders.length,
      icon: ShoppingCart,
      color: "bg-purple-500",
      bgColor: "bg-purple-50",
      textColor: "text-purple-600"
    },
    {
      title: "إجمالي الإيرادات",
      value: `${totalRevenue.toFixed(3)} د.ت`,
      icon: DollarSign,
      color: "bg-green-500",
      bgColor: "bg-green-50",
      textColor: "text-green-600"
    },
    {
      title: "العملاء",
      value: customers.length,
      icon: Users,
      color: "bg-amber-500",
      bgColor: "bg-amber-50",
      textColor: "text-amber-600"
    }
  ];

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div className="animate-fadeIn">
        <h1 className="text-2xl font-bold text-gray-800">لوحة التحكم</h1>
        <p className="text-gray-500 mt-1">مرحباً بك في لوحة إدارة متجرك</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div 
              key={stat.title} 
              className={`stat-card animate-fadeIn stagger-${index + 1} opacity-0`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500 mb-1">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-xl`}>
                  <Icon className={`w-6 h-6 ${stat.textColor}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="card p-6 animate-fadeIn stagger-2 opacity-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">إجراءات سريعة</h2>
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/products" className="btn-primary text-center flex items-center justify-center gap-2">
              <Package className="w-5 h-5" />
              إضافة منتج
            </Link>
            <Link href="/admin/orders" className="btn-secondary text-center flex items-center justify-center gap-2">
              <ShoppingCart className="w-5 h-5" />
              عرض الطلبات
            </Link>
            <Link href="/admin/categories" className="btn-secondary text-center flex items-center justify-center gap-2">
              <Tag className="w-5 h-5" />
              إدارة الفئات
            </Link>
            <Link href="/admin/settings" className="btn-secondary text-center flex items-center justify-center gap-2">
              <Settings className="w-5 h-5" />
              الإعدادات
            </Link>
          </div>
        </div>

        {/* Recent Orders */}
        <div className="card p-6 animate-fadeIn stagger-3 opacity-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-gray-800">آخر الطلبات</h2>
            <Link href="/admin/orders" className="text-amber-600 hover:text-amber-700 text-sm font-medium">
              عرض الكل →
            </Link>
          </div>
          
          {recentOrders.length > 0 ? (
            <div className="space-y-3">
              {recentOrders.map((order: any) => (
                <div key={order.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <ShoppingCart className="w-5 h-5 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">#{order.id.slice(-8)}</p>
                      <p className="text-sm text-gray-500">{new Date(order.order_date).toLocaleDateString('ar-TN')}</p>
                    </div>
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-amber-600">{(order.total_amount || 0).toFixed(3)} د.ت</p>
                    <span className={`badge ${order.status === 'confirmed' ? 'badge-success' : 'badge-warning'}`}>
                      {order.status === 'confirmed' ? 'مؤكد' : 'قيد الانتظار'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">لا توجد طلبات بعد</p>
            </div>
          )}
        </div>
      </div>

      {/* Categories & Products Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6 animate-fadeIn stagger-4 opacity-0">
          <h2 className="text-lg font-bold text-gray-800 mb-4">الفئات</h2>
          <div className="space-y-2">
            {categories.slice(0, 5).map((cat: any) => (
              <div key={cat.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <span className="font-medium text-gray-700">{cat.name}</span>
                <Tag className="w-4 h-4 text-gray-400" />
              </div>
            ))}
            {categories.length === 0 && (
              <p className="text-gray-500 text-center py-4">لا توجد فئات</p>
            )}
          </div>
        </div>

        <div className="card p-6">
          <h2 className="text-lg font-bold text-gray-800 mb-4">المنتجات</h2>
          <div className="space-y-2">
            {products.slice(0, 5).map((product: any) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {product.image_url ? (
                    <img src={product.image_url} alt={product.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-amber-600" />
                    </div>
                  )}
                  <span className="font-medium text-gray-700">{product.name}</span>
                </div>
                <span className="font-bold text-amber-600">{((product.price || 0) / 1000).toFixed(3)} د.ت</span>
              </div>
            ))}
            {products.length === 0 && (
              <p className="text-gray-500 text-center py-4">لا توجد منتجات</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
