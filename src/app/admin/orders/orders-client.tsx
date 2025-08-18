'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/context/SessionProvider';
import { createClient } from '@/lib/supabase/client';
import { Eye, Loader2, Package, ShoppingCart, Users, Truck, CheckCircle, Copy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

interface Order {
  id: string;
  customer_id: string;
  total_amount: number;
  order_date: string;
  status: string;
  payment_method: string;
  customers?: {
    id: string;
    first_name: string | null;
    last_name: string | null;
    email: string;
  };
}

interface Address {
  id: string;
  customer_id: string;
  phone_number: string | null;
  address_line_1: string | null;
  city: string | null;
  country: string | null;
}

function getPaymentMethodTextAr(method?: string | null) {
  const m = (method || '').toString().trim();
  switch (m) {
    case 'cash_on_delivery':
      return 'الدفع عند الاستلام';
    case 'mobile_payment':
      return 'الخصم من بطاقة e-Dinar';
    case 'bank_transfer':
      return 'تحويل بنكي';
    case 'paypal':
      return 'PayPal';
    default:
      return 'غير محدد';
  }
}

function getStatusBadge(status?: string | null) {
  const s = (status || '').toString().trim();
  const key = s.toLowerCase();
  if (!key || ['pending confirmation', 'pending', 'awaiting confirmation', 'awaiting_confirmation'].includes(key)) {
    return (
      <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
        في انتظار التأكيد
      </Badge>
    );
  }
  if (key === 'confirmed') {
    return (
      <Badge variant='outline' className='bg-green-50 text-green-700 border-green-200'>
        مؤكد
      </Badge>
    );
  }
  if (key === 'processing' || key === 'packed' || key === 'emballé') {
    return (
      <Badge variant='outline' className='bg-purple-50 text-purple-700 border-purple-200'>
        قيد التحضير
      </Badge>
    );
  }
  if (key === 'shipped') {
    return (
      <Badge variant='outline' className='bg-indigo-50 text-indigo-700 border-indigo-200'>
        تم الشحن
      </Badge>
    );
  }
  if (key === 'delivered') {
    return (
      <Badge variant='outline' className='bg-blue-50 text-blue-700 border-blue-200'>
        تم التوصيل
      </Badge>
    );
  }
  if (key === 'cancelled' || key === 'canceled') {
    return <Badge variant='destructive'>ملغي</Badge>;
  }
  return (
    <Badge variant='outline' className='bg-yellow-50 text-yellow-700 border-yellow-200'>
      في انتظار التأكيد
    </Badge>
  );
}

export default function OrdersClientPage() {
  const { session } = useSession();
  const supabase = createClient();
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & pagination
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'Pending Confirmation' | 'Confirmed' | 'Processing' | 'Shipped' | 'Delivered' | 'Cancelled'>('ALL');
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'cash_on_delivery' | 'mobile_payment' | 'bank_transfer' | 'paypal'>('ALL');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  useEffect(() => {
    async function fetchOrders() {
      try {
        setLoading(true);
        setError(null);

        // Optional phone-based prefilter: if search contains digits, find matching customer_ids by phone
        let phoneMatchedIds: string[] = [];
        const term = search.trim();
        if (term) {
        const digits = term.replace(/\D+/g, '');
      if (digits.length >= 4) {
        const { data: phoneAddrs } = await supabase
  .from('addresses')
        .select('customer_id, phone_number')
            .ilike('phone_number', `%${digits}%`)
            .limit(1000);
   phoneMatchedIds = (phoneAddrs || []).map((a: any) => a.customer_id).filter(Boolean);
           }
  }

  let query = supabase
  .from('orders')
  .select(`
   *,
  customers (
     id,
       first_name,
       last_name,
     email
     )
   `, { count: 'exact' })
  .order('order_date', { ascending: false });

  if (statusFilter !== 'ALL') {
   if (statusFilter === 'Pending Confirmation') {
  query = query.or('status.is.null,status.eq.Pending%20Confirmation,status.eq.pending,status.eq.awaiting%20confirmation,status.eq.awaiting_confirmation');
  } else if (statusFilter === 'Processing') {
    query = query.or('status.eq.Processing,status.eq.packed,status.eq.emball%C3%A9');
    } else {
      query = query.eq('status', statusFilter);
  }
  }
  if (paymentFilter !== 'ALL') {
  query = query.eq('payment_method', paymentFilter);
  }
         if (dateFrom) {
    const gteIso = new Date(`${dateFrom}T00:00:00.000Z`).toISOString();
    query = query.gte('order_date', gteIso);
  }
         if (dateTo) {
        const lteIso = new Date(`${dateTo}T23:59:59.999Z`).toISOString();
          query = query.lte('order_date', lteIso);
         }
      if (term) {
          const ors: string[] = [
             `id.ilike.%${term}%`,
        `customers.email.ilike.%${term}%`,
     `customers.first_name.ilike.%${term}%`,
      `customers.last_name.ilike.%${term}%`,
      ];
  if (phoneMatchedIds.length > 0) {
  const idsList = phoneMatchedIds.map(id => `"${id}"`).join(',');
  ors.push(`customer_id.in.(${idsList})`);
           }
  query = query.or(ors.join(','));
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data: ordersData, error: ordersError, count } = await query;
  if (ordersError) throw ordersError;

  setOrders(ordersData || []);
  setTotalCount(count || 0);

  // Récupérer les adresses (téléphone / ville / العنوان)
    if (ordersData && ordersData.length > 0) {
        const customerIds = ordersData.map((order: any) => order.customer_id);
           const { data: addressesData, error: addressesError } = await supabase
          .from('addresses')
        .select('*')
          .in('customer_id', customerIds);

          if (addressesError) {
            console.warn('Erreur récupération adresses:', addressesError);
            setAddresses([]);
          } else {
            setAddresses(addressesData || []);
          }
        } else {
          setAddresses([]);
        }
      } catch (err: any) {
        console.error('Erreur chargement commandes:', err);
        setError(err.message || 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    }

    if (supabase) {
      fetchOrders();
    }
  }, [supabase, statusFilter, paymentFilter, dateFrom, dateTo, search, page, pageSize]);

  // Statistiques basées sur le filtre courant (requête légère)
  const [stats, setStats] = useState({ totalOrders: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, revenue: 0 });
  useEffect(() => {
    async function fetchStats() {
      try {
        const { data, error } = await supabase
          .from('orders')
          .select('status,total_amount', { count: 'exact' })
          .limit(10000);
        if (error) return;
        const normalize = (s: any) => ((s || '') as string).toLowerCase();
        const totalOrders = data?.length || 0;
        const pending = (data || []).filter((o: any) => {
          const key = normalize(o.status);
          return !key || ['pending confirmation','pending','awaiting confirmation','awaiting_confirmation'].includes(key);
        }).length;
        const confirmed = (data || []).filter((o: any) => normalize(o.status) === 'confirmed').length;
        const processing = (data || []).filter((o: any) => ['processing','packed','emballé'].includes(normalize(o.status))).length;
        const shipped = (data || []).filter((o: any) => normalize(o.status) === 'shipped').length;
        const delivered = (data || []).filter((o: any) => normalize(o.status) === 'delivered').length;
        const cancelled = (data || []).filter((o: any) => ['cancelled','canceled'].includes(normalize(o.status))).length;
        const revenue = (data || []).reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0);
        setStats({ totalOrders, pending, confirmed, processing, shipped, delivered, cancelled, revenue });
      } catch {}
    }
    fetchStats();
  }, [supabase]);


 if (loading) {
    return (
      <div className='container mx-auto py-10 px-4'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-blue-600' />
            <p className='text-gray-600'>جاري تحميل الطلبات...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='container mx-auto py-10 px-4'>
        <div className='bg-red-50 border border-red-200 rounded-lg p-6'>
          <h2 className='text-red-800 font-semibold mb-2'>خطأ في تحميل الطلبات</h2>
          <p className='text-red-700'>حدث خطأ أثناء تحميل قائمة الطلبات: {error}</p>
          <Button onClick={() => window.location.reload()} className='mt-4' variant='outline'>
            إعادة المحاولة
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10 px-4'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-blue-600 mb-2'>إدارة الطلبات</h1>
        <p className='text-gray-600'>إدارة ومتابعة جميع طلبات العملاء</p>
      </div>

      {/* Filters */}
      <Card className='mb-6'>
        <CardContent className='pt-6'>
          <div className='grid grid-cols-1 lg:grid-cols-6 gap-3'>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>الحالة</label>
              <select className='w-full border rounded-md p-2'
                value={statusFilter}
                onChange={(e) => { setPage(1); setStatusFilter(e.target.value as any); }}>
                <option value='ALL'>الكل</option>
                <option value='Pending Confirmation'>في انتظار التأكيد</option>
                <option value='Confirmed'>مؤكد</option>
                <option value='Processing'>قيد التحضير</option>
                <option value='Shipped'>تم الشحن</option>
                <option value='Delivered'>تم التوصيل</option>
                <option value='Cancelled'>ملغي</option>
              </select>
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>طريقة الدفع</label>
              <select className='w-full border rounded-md p-2'
                value={paymentFilter}
                onChange={(e) => { setPage(1); setPaymentFilter(e.target.value as any); }}>
                <option value='ALL'>الكل</option>
                <option value='cash_on_delivery'>الدفع عند الاستلام</option>
                <option value='mobile_payment'>الخصم من بطاقة e-Dinar</option>
                <option value='bank_transfer'>تحويل بنكي</option>
                <option value='paypal'>PayPal</option>
              </select>
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>من تاريخ</label>
              <input type='date' className='w-full border rounded-md p-2' value={dateFrom}
                onChange={(e) => { setPage(1); setDateFrom(e.target.value); }} />
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>إلى تاريخ</label>
              <input type='date' className='w-full border rounded-md p-2' value={dateTo}
                onChange={(e) => { setPage(1); setDateTo(e.target.value); }} />
            </div>
            <div className='lg:col-span-2'>
              <label className='block text-sm text-gray-600 mb-1'>بحث (البريد/الاسم/رقم الطلب)</label>
              <input className='w-full border rounded-md p-2' placeholder='اكتب للبحث...'
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }} />
            </div>
            <div>
              <label className='block text-sm text-gray-600 mb-1'>عدد العناصر في الصفحة</label>
              <select className='w-full border rounded-md p-2' value={pageSize} onChange={(e) => { setPage(1); setPageSize(parseInt(e.target.value)); }}>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Statistiques (avec filtres appliqués) */}
      <div className='grid grid-cols-1 md:grid-cols-4 xl:grid-cols-6 gap-6 mb-8'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>إجمالي الطلبات</CardTitle>
            <ShoppingCart className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>في انتظار التأكيد</CardTitle>
            <Package className='h-4 w-4 text-yellow-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>{stats.pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>مؤكدة</CardTitle>
            <Users className='h-4 w-4 text-green-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>{stats.confirmed}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>قيد التحضير</CardTitle>
            <Package className='h-4 w-4 text-purple-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-600'>{stats.processing}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>تم الشحن</CardTitle>
            <Truck className='h-4 w-4 text-indigo-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-indigo-600'>{stats.shipped}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>تم التوصيل</CardTitle>
            <CheckCircle className='h-4 w-4 text-blue-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>{stats.delivered}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>ملغي</CardTitle>
            <Package className='h-4 w-4 text-red-600' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>{stats.cancelled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>إجمالي الإيرادات</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.revenue.toFixed(2)} د.ت</div>
          </CardContent>
        </Card>
      </div>

      {/* Liste des commandes */}
      <Card>
      <CardHeader>
      <CardTitle>قائمة الطلبات</CardTitle>
      </CardHeader>
      <CardContent>
      {orders.length === 0 ? (
      <div className='text-center py-12'>
      <Package className='w-12 h-12 text-gray-400 mx-auto mb-4' />
      <h3 className='text-lg font-semibold text-gray-900 mb-2'>لا توجد طلبات</h3>
      <p className='text-gray-600'>لم يتم إنشاء أي طلبات بعد.</p>
      </div>
      ) : (
      <div className='space-y-4'>
      {orders.map(order => {
      const customer = order.customers;
      const customerAddress = addresses.find(addr => addr.customer_id === order.customer_id);
      const phone = customerAddress?.phone_number || '—';
      const shortId = `#${order.id.slice(-8).toUpperCase()}`;
      return (
      <div key={order.id} className='border rounded-xl bg-white p-4 md:p-5 shadow-sm hover:shadow-md transition'>
      <div className='flex flex-col md:flex-row md:items-center md:justify-between gap-3 border-b pb-3'>
        <div className='flex items-center gap-3'>
          <span className='text-sm text-gray-500'>رقم الطلب</span>
        <span className='font-bold text-honey-dark'>{shortId}</span>
        </div>
        <div className='flex items-center gap-2'>
        {getStatusBadge(order.status)}
          <span className='text-sm text-gray-500'>بتاريخ</span>
          <span className='text-sm'>{new Date(order.order_date).toLocaleDateString('ar-TN')}</span>
      </div>
      </div>

      <div className='grid grid-cols-1 md:grid-cols-5 gap-4 pt-3'>
        <div>
          <div className='text-xs text-gray-500 mb-1'>العميل</div>
          <div className='font-semibold'>
            {customer ? `${customer.first_name || ''} ${customer.last_name || ''}`.trim() : 'غير محدد'}
          </div>
          <div className='text-xs text-gray-500'>{customer?.email || ''}</div>
        </div>

        <div>
          <div className='text-xs text-gray-500 mb-1'>الهاتف</div>
          <div className='flex items-center gap-2'>
            {phone !== '—' ? (
              <a href={`tel:${phone}`} className='text-lg font-bold text-honey-dark'>{phone}</a>
            ) : (
              <span className='text-gray-400'>—</span>
            )}
            {phone !== '—' && (
              <Button variant='outline' size='sm' onClick={async () => { try { await navigator.clipboard.writeText(phone); } catch {} }}>
                <Copy className='w-4 h-4' />
              </Button>
            )}
          </div>
        </div>

        <div>
          <div className='text-xs text-gray-500 mb-1'>طريقة الدفع</div>
          <div className='font-medium'>{getPaymentMethodTextAr((order as any).payment_method)}</div>
        </div>

        <div>
          <div className='text-xs text-gray-500 mb-1'>المدينة</div>
          <div className='font-medium'>{(addresses.find(a => a.customer_id === order.customer_id)?.city) || '—'}</div>
        </div>

        <div>
          <div className='text-xs text-gray-500 mb-1'>المبلغ</div>
          <div className='text-lg font-bold text-gray-900'>{order.total_amount.toFixed(2)} د.ت</div>
        </div>

        <div className='md:col-span-5'>
          <div className='text-xs text-gray-500 mb-1'>العنوان</div>
          <div className='text-sm'>{(addresses.find(a => a.customer_id === order.customer_id)?.address_line_1) || '—'}</div>
        </div>

        <div className='md:col-span-5 flex items-end justify-end'>
          <Button variant='outline' asChild>
            <Link href={`/admin/orders/${order.id}`}>
              <Eye className='w-4 h-4 ml-1' /> عرض التفاصيل
            </Link>
          </Button>
        </div>
      </div>
      </div>
      );
      })}

      {/* Pagination */}
      <div className='flex items-center justify-between mt-2'>
      <div className='text-sm text-gray-600'>
      الصفحة {page} من {totalPages} — إجمالي {totalCount} طلب
      </div>
      <div className='flex gap-2'>
      <Button variant='outline' size='sm' onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1}>
      السابق
      </Button>
      <Button variant='outline' size='sm' onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages}>
      التالي
      </Button>
      </div>
      </div>
      </div>
      )}
      </CardContent>
      </Card>
    </div>
  );
}
