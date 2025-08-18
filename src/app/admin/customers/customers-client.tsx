'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useSession } from '@/context/SessionProvider';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';
import { Calendar, Loader2, Mail, MapPin, Phone, Users } from 'lucide-react';
import { useEffect, useState } from 'react';

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  created_at: string;
  addresses?: {
    id: string;
    phone_number?: string;
    address_line_1?: string;
    city?: string;
    country?: string;
  }[];
  orders_count?: number;
  total_spent?: number;
}

export default function CustomersClientPage() {
  const { session } = useSession();
  const { toast } = useToast();
  const supabase = createClient();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger les clients
  useEffect(() => {
    async function fetchCustomers() {
      try {
        setLoading(true);

        // Récupérer les clients avec leurs adresses
        const { data: customersData, error: customersError } = await supabase
          .from('customers')
          .select(
            `
            *,
            addresses (
              id,
              phone_number,
              address_line_1,
              city,
              country
            )
          `
          )
          .order('created_at', { ascending: false });

        if (customersError) throw customersError;

        // Récupérer les statistiques de commandes pour chaque client
        const customersWithStats = await Promise.all(
          (customersData || []).map(async (customer: any) => {
            const { data: orders, error: ordersError } = await supabase
              .from('orders')
              .select('total_amount')
              .eq('customer_id', customer.id);

            if (ordersError) {
              console.warn('Erreur récupération commandes client:', ordersError);
              return {
                ...customer,
                orders_count: 0,
                total_spent: 0,
              };
            }

            return {
              ...customer,
              orders_count: orders.length,
              total_spent: orders.reduce((sum: number, order: any) => sum + order.total_amount, 0),
            };
          })
        );

        setCustomers(customersWithStats);
      } catch (error: any) {
        console.error('Erreur chargement clients:', error);
        toast({
          title: 'خطأ في التحميل',
          description: 'فشل في تحميل قائمة العملاء',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    }

    if (supabase) {
      fetchCustomers();
    }
  }, [supabase, toast]);

  if (loading) {
    return (
      <div className='container mx-auto py-10 px-4'>
        <div className='flex items-center justify-center py-12'>
          <div className='text-center'>
            <Loader2 className='h-8 w-8 animate-spin mx-auto mb-4 text-blue-600' />
            <p className='text-gray-600'>جاري تحميل العملاء...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='container mx-auto py-10 px-4 max-w-6xl'>
      <div className='mb-8'>
        <h1 className='text-3xl font-bold text-blue-600 mb-2 flex items-center gap-3'>
          <Users className='h-8 w-8' />
          إدارة العملاء
        </h1>
        <p className='text-gray-600'>عرض ومتابعة معلومات العملاء</p>
      </div>

      {/* إحصائيات سريعة */}
      <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-8'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>إجمالي العملاء</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{customers.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>عملاء نشطون</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {customers.filter(c => (c.orders_count || 0) > 0).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>متوسط الإنفاق</CardTitle>
            <Users className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {customers.length > 0
                ? (customers.reduce((sum, c) => sum + (c.total_spent || 0), 0) / customers.length).toFixed(2)
                : '0.00'}{' '}
              د.ت
            </div>
          </CardContent>
        </Card>
      </div>

      {/* قائمة العملاء */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'>
        {customers.length === 0 ? (
          <div className='col-span-full text-center py-12'>
            <Users className='h-12 w-12 text-gray-400 mx-auto mb-4' />
            <h3 className='text-lg font-semibold text-gray-900 mb-2'>لا يوجد عملاء</h3>
            <p className='text-gray-600'>لم يتم تسجيل أي عملاء بعد</p>
          </div>
        ) : (
          customers.map(customer => (
            <Card key={customer.id} className='hover:shadow-md transition-shadow'>
              <CardHeader>
                <CardTitle className='text-lg'>
                  {customer.first_name} {customer.last_name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  {/* معلومات الاتصال */}
                  <div className='flex items-center gap-2 text-sm'>
                    <Mail className='h-4 w-4 text-gray-500' />
                    <span className='text-gray-700'>{customer.email}</span>
                  </div>

                  {customer.addresses && customer.addresses.length > 0 && (
                    <>
                      {customer.addresses[0].phone_number && (
                        <div className='flex items-center gap-2 text-sm'>
                          <Phone className='h-4 w-4 text-gray-500' />
                          <span className='text-gray-700'>{customer.addresses[0].phone_number}</span>
                        </div>
                      )}

                      {customer.addresses[0].address_line_1 && (
                        <div className='flex items-start gap-2 text-sm'>
                          <MapPin className='h-4 w-4 text-gray-500 mt-0.5' />
                          <div className='text-gray-700'>
                            <div>{customer.addresses[0].address_line_1}</div>
                            {customer.addresses[0].city && (
                              <div>
                                {customer.addresses[0].city}, {customer.addresses[0].country || 'تونس'}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* تاريخ التسجيل */}
                  <div className='flex items-center gap-2 text-sm'>
                    <Calendar className='h-4 w-4 text-gray-500' />
                    <span className='text-gray-700'>
                      انضم في {new Date(customer.created_at).toLocaleDateString('ar-TN')}
                    </span>
                  </div>

                  {/* إحصائيات العميل */}
                  <div className='pt-3 border-t border-gray-200'>
                    <div className='grid grid-cols-2 gap-4 text-center'>
                      <div>
                        <div className='text-lg font-bold text-blue-600'>{customer.orders_count || 0}</div>
                        <div className='text-xs text-gray-500'>طلب</div>
                      </div>
                      <div>
                        <div className='text-lg font-bold text-green-600'>
                          {(customer.total_spent || 0).toFixed(2)} د.ت
                        </div>
                        <div className='text-xs text-gray-500'>إجمالي الإنفاق</div>
                      </div>
                    </div>
                  </div>

                  {/* حالة العميل */}
                  <div className='pt-2'>
                    {(customer.orders_count || 0) > 0 ? (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800'>
                        عميل نشط
                      </span>
                    ) : (
                      <span className='inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800'>
                        عميل جديد
                      </span>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
