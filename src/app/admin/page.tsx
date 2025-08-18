// src/app/admin/page.tsx
import { createClientServer } from '@/lib/supabase/server';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Package, Tags, ShoppingCart, Truck, CheckCircle } from 'lucide-react';

function StatCard({ title, value, icon: Icon, color = 'text-gray-600' }: { title: string; value: string | number; icon: React.ElementType; color?: string }) {
  return (
    <div className="bg-white p-5 rounded-xl shadow-sm border">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold mt-1">{value}</p>
        </div>
        <div className="p-3 rounded-full bg-gray-50">
          <Icon className={`h-6 w-6 ${color}`} />
        </div>
      </div>
    </div>
  );
}

function getStatusBadgeAr(status?: string | null) {
  const s = (status || '').toLowerCase();
  if (!s || ['pending confirmation','pending','awaiting confirmation','awaiting_confirmation'].includes(s)) {
    return <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">في انتظار التأكيد</Badge>;
  }
  if (s === 'confirmed') return <Badge className="bg-green-50 text-green-700 border border-green-200">مؤكد</Badge>;
  if (['processing','packed','emballé'].includes(s)) return <Badge className="bg-purple-50 text-purple-700 border border-purple-200">قيد التحضير</Badge>;
  if (s === 'shipped') return <Badge className="bg-indigo-50 text-indigo-700 border border-indigo-200">تم الشحن</Badge>;
  if (s === 'delivered') return <Badge className="bg-blue-50 text-blue-700 border border-blue-200">تم التوصيل</Badge>;
  if (['cancelled','canceled'].includes(s)) return <Badge variant="destructive">ملغي</Badge>;
  return <Badge className="bg-yellow-50 text-yellow-700 border border-yellow-200">في انتظار التأكيد</Badge>;
}

function getPaymentAr(m?: string | null) {
  switch ((m || '').trim()) {
    case 'cash_on_delivery': return 'الدفع عند الاستلام';
    case 'mobile_payment': return 'الخصم من بطاقة e-Dinar';
    case 'bank_transfer': return 'تحويل بنكي';
    case 'paypal': return 'PayPal';
    default: return 'غير محدد';
  }
}

export default async function AdminPage() {
  // Utiliser la service key pour éviter les soucis RLS dans le Dashboard
  const supabase = await createClientServer('service_role');

  // Compteurs de base
  const [{ count: productCount }, { count: categoryCount }, { count: orderCount }] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
  ]);

  // Clients (fallback sans RPC)
  const { count: customerCount } = await supabase.from('customers').select('*', { count: 'exact', head: true });

  // Commandes récentes enrichies
  const { data: recent, error: ordersErr } = await supabase
    .from('orders')
    .select('id, order_date, customer_id, total_amount, status, payment_method')
    .order('order_date', { ascending: false })
    .limit(8);

  let recentOrders = recent || [];
  let addressesMap: Record<string, any> = {};
  let customersMap: Record<string, any> = {};
  if (recentOrders.length > 0) {
    const ids = recentOrders.map(o => o.customer_id);
    const [{ data: addrs }, { data: custs }] = await Promise.all([
      supabase.from('addresses').select('customer_id, phone_number, city, address_line_1').in('customer_id', ids),
      supabase.from('customers').select('id, first_name, last_name, email').in('id', ids),
    ]);
    (addrs || []).forEach(a => { addressesMap[a.customer_id] = a; });
    (custs || []).forEach(c => { customersMap[c.id] = c; });
  }

  // Statistiques par état (globales)
  const { data: allOrders } = await supabase.from('orders').select('status, total_amount');
  const normalize = (s: any) => ((s || '') as string).toLowerCase();
  const stats = {
    total: allOrders?.length || 0,
    pending: (allOrders || []).filter(o => {
      const k = normalize(o.status);
      return !k || ['pending confirmation','pending','awaiting confirmation','awaiting_confirmation'].includes(k);
    }).length,
    confirmed: (allOrders || []).filter(o => normalize(o.status) === 'confirmed').length,
    processing: (allOrders || []).filter(o => ['processing','packed','emballé'].includes(normalize(o.status))).length,
    shipped: (allOrders || []).filter(o => normalize(o.status) === 'shipped').length,
    delivered: (allOrders || []).filter(o => normalize(o.status) === 'delivered').length,
    cancelled: (allOrders || []).filter(o => ['cancelled','canceled'].includes(normalize(o.status))).length,
    revenue: (allOrders || []).reduce((s, o: any) => s + Number(o.total_amount || 0), 0),
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-honey-dark">لوحة تحكم المشرف</h1>

      {/* Statistiques principales */}
      <div className="grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6 gap-4 mb-8">
        <StatCard title="إجمالي الطلبات" value={stats.total} icon={ShoppingCart} />
        <StatCard title="في انتظار التأكيد" value={stats.pending} icon={Package} color="text-yellow-600" />
        <StatCard title="مؤكدة" value={stats.confirmed} icon={Users} color="text-green-600" />
        <StatCard title="قيد التحضير" value={stats.processing} icon={Package} color="text-purple-600" />
        <StatCard title="تم الشحن" value={stats.shipped} icon={Truck} color="text-indigo-600" />
        <StatCard title="تم التوصيل" value={stats.delivered} icon={CheckCircle} color="text-blue-600" />
        <StatCard title="ملغي" value={stats.cancelled} icon={Package} color="text-red-600" />
        <StatCard title="إجمالي الإيرادات" value={`${stats.revenue.toFixed(2)} د.ت`} icon={Package} />
        <StatCard title="إجمالي العملاء" value={customerCount ?? 0} icon={Users} />
        <StatCard title="إجمالي المنتجات" value={productCount ?? 0} icon={Package} />
        <StatCard title="إجمالي الفئات" value={categoryCount ?? 0} icon={Tags} />
      </div>

      {/* الطلبات الأخيرة (cartes en arabe) */}
      <Card>
        <CardHeader>
          <CardTitle>الطلبات الأخيرة</CardTitle>
        </CardHeader>
        <CardContent>
          {recentOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500">لا توجد طلبات حديثة</div>
          ) : (
            <div className="space-y-4">
              {recentOrders.map(order => {
                const c = customersMap[order.customer_id] || {};
                const a = addressesMap[order.customer_id] || {};
                const shortId = `#${order.id.slice(-8).toUpperCase()}`;
                return (
                  <div key={order.id} className="border rounded-xl bg-white p-4 md:p-5 shadow-sm">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b pb-3">
                      <div className="flex items-center gap-3">
                        <span className="text-sm text-gray-500">رقم الطلب</span>
                        <span className="font-bold text-honey-dark">{shortId}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadgeAr(order.status)}
                        <span className="text-sm text-gray-500">بتاريخ</span>
                        <span className="text-sm">{new Date(order.order_date).toLocaleDateString('ar-TN')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-3">
                      <div>
                        <div className="text-xs text-gray-500 mb-1">العميل</div>
                        <div className="font-semibold">{`${c.first_name || ''} ${c.last_name || ''}`.trim() || 'غير محدد'}</div>
                        <div className="text-xs text-gray-500">{c.email || ''}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">الهاتف</div>
                        <div className="text-sm font-semibold">{a.phone_number || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">طريقة الدفع</div>
                        <div className="font-medium">{getPaymentAr((order as any).payment_method)}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">المدينة</div>
                        <div className="font-medium">{a.city || '—'}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500 mb-1">المبلغ</div>
                        <div className="text-lg font-bold text-gray-900">{Number(order.total_amount || 0).toFixed(2)} د.ت</div>
                      </div>
                      <div className="md:col-span-5 flex items-end justify-end">
                        <Link href={`/admin/orders/${order.id}`} className="text-honey-dark underline">عرض التفاصيل</Link>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
