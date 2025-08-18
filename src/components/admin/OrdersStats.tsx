'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, Package, ShoppingCart, TrendingUp, Truck, Users, XCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface OrderStats {
  total: number;
  pending: number;
  confirmed: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  todayOrders: number;
  totalRevenue: number;
}

export default function OrdersStats() {
  const [stats, setStats] = useState<OrderStats>({
    total: 0,
    pending: 0,
    confirmed: 0,
    processing: 0,
    shipped: 0,
    delivered: 0,
    cancelled: 0,
    todayOrders: 0,
    totalRevenue: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/orders/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      // Set default stats in case of error
      setStats({
        total: 0,
        pending: 0,
        confirmed: 0,
        processing: 0,
        shipped: 0,
        delivered: 0,
        cancelled: 0,
        todayOrders: 0,
        totalRevenue: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8'>
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardContent className='p-6'>
              <div className='animate-pulse'>
                <div className='h-4 bg-gray-200 rounded w-3/4 mb-2'></div>
                <div className='h-8 bg-gray-200 rounded w-1/2'></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'إجمالي الطلبات',
      value: stats.total,
      icon: ShoppingCart,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'طلبات اليوم',
      value: stats.todayOrders,
      icon: TrendingUp,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'في انتظار التأكيد',
      value: stats.pending,
      icon: Clock,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'الإيرادات الإجمالية',
      value: `${stats.totalRevenue.toFixed(2)} د.ت`,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  const statusCards = [
    {
      title: 'مؤكد',
      value: stats.confirmed,
      color: 'bg-green-50 text-green-700 border-green-200',
      icon: CheckCircle,
    },
    {
      title: 'قيد التحضير',
      value: stats.processing,
      color: 'bg-blue-50 text-blue-700 border-blue-200',
      icon: Package,
    },
    {
      title: 'تم الشحن',
      value: stats.shipped,
      color: 'bg-purple-50 text-purple-700 border-purple-200',
      icon: Truck,
    },
    {
      title: 'ملغي',
      value: stats.cancelled,
      color: 'bg-red-50 text-red-700 border-red-200',
      icon: XCircle,
    },
  ];

  return (
    <div className='space-y-6 mb-8'>
      {/* Main Stats */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardContent className='p-6'>
                <div className='flex items-center justify-between'>
                  <div>
                    <p className='text-sm font-medium text-gray-600'>{stat.title}</p>
                    <p className='text-2xl font-bold text-gray-900'>{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>توزيع الطلبات حسب الحالة</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
            {statusCards.map((status, index) => {
              const Icon = status.icon;
              return (
                <div key={index} className='text-center'>
                  <Badge className={`${status.color} mb-2 px-3 py-1`}>
                    <Icon className='w-4 h-4 mr-1' />
                    {status.title}
                  </Badge>
                  <p className='text-2xl font-bold text-gray-900'>{status.value}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
